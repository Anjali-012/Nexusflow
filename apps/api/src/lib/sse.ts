import { Response } from "express";

interface SSEClient {
  runId: string;
  res: Response;
}

const clients = new Map<string, SSEClient[]>();

export function addClient(runId: string, res: Response): void {
  const existing = clients.get(runId) ?? [];
  clients.set(runId, [...existing, { runId, res }]);
}

export function removeClient(runId: string, res: Response): void {
  const existing = clients.get(runId) ?? [];
  const updated = existing.filter((c) => c.res !== res);
  if (updated.length === 0) {
    clients.delete(runId);
  } else {
    clients.set(runId, updated);
  }
}

export function sendEvent(runId: string, event: string, data: unknown): void {
  const runClients = clients.get(runId) ?? [];
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of runClients) {
    client.res.write(payload);
  }
}

export function initSSEResponse(res: Response): void {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
}
