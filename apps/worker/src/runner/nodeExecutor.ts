import { executeHttpAction } from "../adapters/httpAction";
import { executeAINode, AINodeConfig } from "../adapters/aiCopilot";
import {
  resolveTemplate,
  resolveConfig,
  ExecutionContext,
} from "./templateResolver";
import logger from "../lib/logger";

interface WorkflowNode {
  id: string;
  subType: string;
  config: Record<string, unknown>;
}

export async function executeNode(
  node: WorkflowNode,
  ctx: ExecutionContext,
): Promise<unknown> {
  const resolvedConfig = await resolveConfig(node.config, ctx);

  switch (node.subType) {
    case "webhook":
    case "manual":
    case "schedule":
      return ctx.triggerPayload;

    case "http_request":
      return executeHttpAction(resolvedConfig);

    case "delay": {
      const delayMs = Number(resolvedConfig.delayMs) || 1000;
      logger.info(`Delaying ${delayMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return { delayed: delayMs };
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

      const comparisons: Record<string, () => boolean> = {
        eq: () => String(actual) === expectedValue,
        neq: () => String(actual) !== expectedValue,
        gt: () => Number(actual) > Number(expectedValue),
        lt: () => Number(actual) < Number(expectedValue),
        contains: () => String(actual).includes(expectedValue),
        regex: () => new RegExp(expectedValue).test(String(actual)),
      };

      const result = comparisons[operator]?.() ?? false;
      return { result, branch: result ? "true_branch" : "false_branch" };
    }

    case "data_mapper": {
      const sourceField = resolvedConfig.sourceField as string;
      const targetField = resolvedConfig.targetField as string;
      const resolved = resolveTemplate(`{{${sourceField}}}`, ctx);
      return { [targetField]: resolved };
    }

    case "ai_copilot": {
      const result = await executeAINode(
        resolvedConfig as unknown as AINodeConfig,
        { trigger: ctx.triggerPayload, nodes: ctx.nodeOutputs },
      );
      return result.output;
    }

    default:
      logger.warn(`Unknown node subType: ${node.subType}`);
      return {};
  }
}
