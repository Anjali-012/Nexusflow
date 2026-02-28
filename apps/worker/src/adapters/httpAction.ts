import axios from "axios";

export interface HttpActionConfig {
  url: string;
  method?: string;
  body?: string;
  headers?: string;
  timeoutMs?: number;
}

export async function executeHttpAction(
  config: Record<string, unknown>,
): Promise<unknown> {
  const url = config.url as string;
  const method = (config.method as string) || "GET";
  const timeoutMs = Number(config.timeoutMs) || 30000;

  if (!url) {
    throw new Error("HTTP Action: url is required");
  }

  // Parse body if provided
  let data: unknown = undefined;
  if (config.body && typeof config.body === "string") {
    try {
      data = JSON.parse(config.body);
    } catch {
      data = config.body;
    }
  }

  // Parse headers if provided
  let headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.headers && typeof config.headers === "string") {
    try {
      headers = { ...headers, ...JSON.parse(config.headers) };
    } catch {
      // ignore invalid headers
    }
  }

  console.log(`[HttpAction] ${method} ${url}`);

  const response = await axios({
    method: method.toLowerCase(),
    url,
    data,
    headers,
    timeout: timeoutMs,
  });

  return {
    status: response.status,
    data: response.data,
  };
}
