export interface ExecutionContext {
  workflowId: string;
  tenantId: string;
  correlationId: string;
  triggerPayload: Record<string, unknown>;
  nodeOutputs: Record<string, unknown>;
}

export function resolveTemplate(value: string, ctx: ExecutionContext): string {
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

export function resolveConfig(
  config: Record<string, unknown>,
  ctx: ExecutionContext,
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    resolved[key] =
      typeof value === "string" ? resolveTemplate(value, ctx) : value;
  }
  return resolved;
}
