import mongoose from "mongoose";
import { Workflow } from "../models/workflow.model";
import { ExecutionRun, ExecutionStep } from "../models/execution.model";
import { WorkflowJobData } from "../lib/types";
import { topologicalSort } from "./topologicalSort";
import { executeNode } from "./nodeExecutor";
import { publish } from "./publisher";
import { ExecutionContext } from "./templateResolver";

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

  const workflow = await Workflow.findOne({
    _id: new mongoose.Types.ObjectId(workflowId),
    tenantId: new mongoose.Types.ObjectId(tenantId),
  });

  if (!workflow) throw new Error(`Workflow ${workflowId} not found`);
  if (workflow.nodes.length === 0) {
    console.log(`[DAGRunner] Workflow ${workflowId} has no nodes — skipping`);
    return;
  }

  const executionRun = await ExecutionRun.create({
    tenantId: new mongoose.Types.ObjectId(tenantId),
    workflowId: new mongoose.Types.ObjectId(workflowId),
    correlationId,
    status: "running",
    triggeredBy,
    startedAt: runStartedAt,
    triggerPayload,
  });

  const runId = executionRun._id.toString();
  console.log(`[DAGRunner] ExecutionRun created: ${runId}`);

  await publish(runId, "run:started", { runId, workflowId, correlationId });

  const ctx: ExecutionContext = {
    workflowId,
    tenantId,
    correlationId,
    triggerPayload,
    nodeOutputs: {},
  };

  const sortedNodeIds = topologicalSort(workflow.nodes, workflow.edges);
  console.log(`[DAGRunner] Execution order: ${sortedNodeIds.join(" → ")}`);

  let runFailed = false;
  let runErrorMessage = "";

  for (const nodeId of sortedNodeIds) {
    const node = workflow.nodes.find((n) => n.id === nodeId);
    if (!node) continue;

    console.log(`[DAGRunner] Executing node: ${node.label} (${node.subType})`);
    await publish(runId, "node:started", {
      nodeId,
      nodeLabel: node.label,
      nodeType: node.subType,
    });

    const stepStartedAt = new Date();
    let output: unknown = null;
    let stepStatus: "success" | "failed" | "skipped" = "success";
    let errorDetails:
      | { message: string; stack?: string; retryCount: number }
      | undefined;

    try {
      output = await executeNode(node, ctx);
      ctx.nodeOutputs[nodeId] = output;
      console.log(`[DAGRunner] Node ${node.label} completed`, output);

      await publish(runId, "node:completed", {
        nodeId,
        nodeLabel: node.label,
        status: "success",
        durationMs: Date.now() - stepStartedAt.getTime(),
      });
    } catch (err) {
      stepStatus = "failed";
      const errMsg = (err as Error).message;
      errorDetails = {
        message: errMsg,
        stack: (err as Error).stack,
        retryCount: 0,
      };
      console.error(`[DAGRunner] Node ${node.label} failed:`, errMsg);

      await publish(runId, "node:failed", {
        nodeId,
        nodeLabel: node.label,
        error: errMsg,
        durationMs: Date.now() - stepStartedAt.getTime(),
      });

      if (workflow.settings?.errorBehavior === "continue") {
        ctx.nodeOutputs[nodeId] = { error: errMsg };
      } else {
        runFailed = true;
        runErrorMessage = `Node "${node.label}" failed: ${errMsg}`;
      }
    }

    await ExecutionStep.create({
      runId: executionRun._id,
      tenantId: new mongoose.Types.ObjectId(tenantId),
      nodeId: node.id,
      nodeType: node.nodeType,
      nodeLabel: node.label,
      status: stepStatus,
      startedAt: stepStartedAt,
      durationMs: Date.now() - stepStartedAt.getTime(),
      inputData: node.config,
      outputData: (output as Record<string, unknown>) || undefined,
      errorDetails,
    });

    if (runFailed) break;
  }

  const totalDuration = Date.now() - runStartedAt.getTime();

  await ExecutionRun.findByIdAndUpdate(executionRun._id, {
    status: runFailed ? "failed" : "success",
    completedAt: new Date(),
    durationMs: totalDuration,
    errorMessage: runFailed ? runErrorMessage : undefined,
  });

  await publish(runId, runFailed ? "run:failed" : "run:completed", {
    runId,
    status: runFailed ? "failed" : "success",
    durationMs: totalDuration,
    errorMessage: runFailed ? runErrorMessage : undefined,
  });

  console.log(
    `[DAGRunner] Workflow ${workflowId} ${runFailed ? "FAILED" : "completed successfully"} in ${totalDuration}ms`,
  );

  if (runFailed) throw new Error(runErrorMessage);
}
