import mongoose from "mongoose";
import { Workflow } from "../models/workflow.model";
import { ExecutionRun, ExecutionStep } from "../models/execution.model";
import { executeHttpAction } from "../adapters/httpAction";
import { WorkflowJobData } from "../lib/types";

export interface ExecutionContext {
  workflowId: string;
  tenantId: string;
  correlationId: string;
  triggerPayload: Record<string, unknown>;
  nodeOutputs: Record<string, unknown>;
}

/**
 * Kahn's Algorithm — topological sort of DAG
 */
function topologicalSort(
  nodes: Array<{ id: string }>,
  edges: Array<{ sourceNodeId: string; targetNodeId: string }>,
): string[] {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  for (const edge of edges) {
    inDegree.set(edge.targetNodeId, (inDegree.get(edge.targetNodeId) || 0) + 1);
    adjacency.get(edge.sourceNodeId)?.push(edge.targetNodeId);
  }

  const queue: string[] = [];
  for (const [nodeId, degree] of inDegree.entries()) {
    if (degree === 0) queue.push(nodeId);
  }

  const sorted: string[] = [];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    sorted.push(nodeId);

    for (const neighbor of adjacency.get(nodeId) || []) {
      const newDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  if (sorted.length !== nodes.length) {
    throw new Error("Cycle detected in workflow DAG");
  }

  return sorted;
}

/**
 * Resolve template strings like {{nodes.node_abc.output.field}}
 */
function resolveTemplate(value: string, ctx: ExecutionContext): string {
  return value.replace(/\{\{(.+?)\}\}/g, (_, path) => {
    const parts = path.trim().split(".");
    let current: unknown = {
      trigger: ctx.triggerPayload,
      nodes: ctx.nodeOutputs,
    };
    for (const part of parts) {
      current = (current as Record<string, unknown>)?.[part];
    }
    return current !== undefined ? String(current) : "";
  });
}

function resolveConfig(
  config: Record<string, unknown>,
  ctx: ExecutionContext,
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    if (typeof value === "string") {
      resolved[key] = resolveTemplate(value, ctx);
    } else {
      resolved[key] = value;
    }
  }
  return resolved;
}

/**
 * Main DAG Runner — called by BullMQ worker for each job
 */
export async function runDAG(
  workflowId: string,
  tenantId: string,
  correlationId: string,
  triggerPayload: Record<string, unknown>,
  triggeredBy: WorkflowJobData["triggeredBy"] = "webhook",
): Promise<void> {
  console.log(
    `[DAGRunner] Starting workflow ${workflowId} — correlationId: ${correlationId}`,
  );

  const runStartedAt = new Date();

  // Load workflow from MongoDB
  const workflow = await Workflow.findOne({
    _id: new mongoose.Types.ObjectId(workflowId),
    tenantId: new mongoose.Types.ObjectId(tenantId),
  });

  if (!workflow) {
    throw new Error(`Workflow ${workflowId} not found`);
  }

  if (workflow.nodes.length === 0) {
    console.log(`[DAGRunner] Workflow ${workflowId} has no nodes — skipping`);
    return;
  }

  // Create ExecutionRun document — status: running
  const executionRun = await ExecutionRun.create({
    tenantId: new mongoose.Types.ObjectId(tenantId),
    workflowId: new mongoose.Types.ObjectId(workflowId),
    correlationId,
    status: "running",
    triggeredBy,
    startedAt: runStartedAt,
  });

  console.log(`[DAGRunner] ExecutionRun created: ${executionRun._id}`);

  // Build execution context
  const ctx: ExecutionContext = {
    workflowId,
    tenantId,
    correlationId,
    triggerPayload,
    nodeOutputs: {},
  };

  // Topological sort
  const sortedNodeIds = topologicalSort(workflow.nodes, workflow.edges);
  console.log(`[DAGRunner] Execution order: ${sortedNodeIds.join(" → ")}`);

  let runFailed = false;
  let runErrorMessage = "";

  // Execute nodes in order
  for (const nodeId of sortedNodeIds) {
    const node = workflow.nodes.find((n) => n.id === nodeId);
    if (!node) continue;

    console.log(`[DAGRunner] Executing node: ${node.label} (${node.subType})`);

    const stepStartedAt = new Date();
    let output: unknown = null;
    let stepStatus: "success" | "failed" | "skipped" = "success";
    let errorDetails:
      | { message: string; stack?: string; retryCount: number }
      | undefined;

    try {
      const resolvedConfig = resolveConfig(node.config, ctx);

      switch (node.subType) {
        case "webhook":
        case "manual":
        case "schedule":
          output = triggerPayload;
          break;

        case "http_request":
          output = await executeHttpAction(resolvedConfig);
          break;

        case "delay": {
          const delayMs = Number(resolvedConfig.delayMs) || 1000;
          console.log(`[DAGRunner] Delaying ${delayMs}ms`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          output = { delayed: delayMs };
          break;
        }

        case "if_condition": {
          const field = resolvedConfig.field as string;
          const operator = resolvedConfig.operator as string;
          const expectedValue = resolvedConfig.value as string;

          const parts = field?.replace("$.", "").split(".");
          let actual: unknown = {
            payload: ctx.triggerPayload,
            nodes: ctx.nodeOutputs,
          };
          for (const part of parts || []) {
            actual = (actual as Record<string, unknown>)?.[part];
          }

          let result = false;
          switch (operator) {
            case "eq":
              result = String(actual) === expectedValue;
              break;
            case "neq":
              result = String(actual) !== expectedValue;
              break;
            case "gt":
              result = Number(actual) > Number(expectedValue);
              break;
            case "lt":
              result = Number(actual) < Number(expectedValue);
              break;
            case "contains":
              result = String(actual).includes(expectedValue);
              break;
            case "regex":
              result = new RegExp(expectedValue).test(String(actual));
              break;
          }

          output = { result, branch: result ? "true_branch" : "false_branch" };
          console.log(`[DAGRunner] If condition result: ${result}`);
          break;
        }

        case "data_mapper": {
          const sourceField = resolvedConfig.sourceField as string;
          const targetField = resolvedConfig.targetField as string;
          const resolved = resolveTemplate(`{{${sourceField}}}`, ctx);
          output = { [targetField]: resolved };
          break;
        }

        default:
          console.warn(`[DAGRunner] Unknown node subType: ${node.subType}`);
          output = {};
      }

      ctx.nodeOutputs[nodeId] = output;
      console.log(`[DAGRunner] Node ${node.label} completed`, output);
    } catch (err) {
      stepStatus = "failed";
      const errMsg = (err as Error).message;
      errorDetails = {
        message: errMsg,
        stack: (err as Error).stack,
        retryCount: 0,
      };
      console.error(`[DAGRunner] Node ${node.label} failed:`, err);

      if (workflow.settings?.errorBehavior === "continue") {
        ctx.nodeOutputs[nodeId] = { error: errMsg };
      } else {
        runFailed = true;
        runErrorMessage = `Node "${node.label}" failed: ${errMsg}`;
      }
    }

    // Write ExecutionStep for this node
    const stepDuration = Date.now() - stepStartedAt.getTime();
    await ExecutionStep.create({
      runId: executionRun._id,
      tenantId: new mongoose.Types.ObjectId(tenantId),
      nodeId: node.id,
      nodeType: node.nodeType,
      nodeLabel: node.label,
      status: stepStatus,
      startedAt: stepStartedAt,
      durationMs: stepDuration,
      inputData: node.config,
      outputData: (output as Record<string, unknown>) || undefined,
      errorDetails,
    });

    // Stop if errorBehavior is "stop" and node failed
    if (runFailed) break;
  }

  // Update ExecutionRun with final status
  const totalDuration = Date.now() - runStartedAt.getTime();
  await ExecutionRun.findByIdAndUpdate(executionRun._id, {
    status: runFailed ? "failed" : "success",
    completedAt: new Date(),
    durationMs: totalDuration,
    errorMessage: runFailed ? runErrorMessage : undefined,
  });

  console.log(
    `[DAGRunner] Workflow ${workflowId} ${runFailed ? "FAILED" : "completed successfully"} in ${totalDuration}ms`,
  );

  // Re-throw so BullMQ marks the job as failed and retries
  if (runFailed) {
    throw new Error(runErrorMessage);
  }
}
