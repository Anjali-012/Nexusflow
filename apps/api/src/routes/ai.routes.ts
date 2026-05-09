import { Router, Response } from "express";
import OpenAI from "openai";
import { protect, AuthRequest } from "../middleware/auth";

const router = Router();

const client = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set");
  }
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });
};

const SYSTEM_PROMPT = `You are a workflow automation expert. Generate a workflow DAG based on the user's description.

Available node types:
- trigger/manual: {"id":"node-1","nodeType":"trigger","subType":"manual","label":"Manual Trigger","position":{"x":250,"y":100},"config":{}}
- trigger/webhook: {"id":"node-1","nodeType":"trigger","subType":"webhook","label":"Webhook Trigger","position":{"x":250,"y":100},"config":{}}
- trigger/schedule: {"id":"node-1","nodeType":"trigger","subType":"schedule","label":"Schedule Trigger","position":{"x":250,"y":100},"config":{"cron":"0 9 * * *"}}
- action/http_request: {"id":"node-2","nodeType":"action","subType":"http_request","label":"HTTP Request","position":{"x":250,"y":250},"config":{"url":"https://api.example.com","method":"GET","body":""}}
- action/delay: {"id":"node-2","nodeType":"action","subType":"delay","label":"Delay","position":{"x":250,"y":250},"config":{"delayMs":5000}}
- logic_gate/if_condition: {"id":"node-3","nodeType":"logic_gate","subType":"if_condition","label":"If Condition","position":{"x":250,"y":400},"config":{"field":"$.payload.value","operator":"gt","value":"100"}}
- transformer/data_mapper: {"id":"node-4","nodeType":"transformer","subType":"data_mapper","label":"Transform Data","position":{"x":250,"y":550},"config":{"sourceField":"nodes.node-1.output","targetField":"result"}}
- action/ai_copilot: {"id":"node-5","nodeType":"action","subType":"ai_copilot","label":"AI Copilot","position":{"x":250,"y":400},"config":{"instruction":"Analyze this data","outputSchema":{"result":"string"}}}

Rules:
- Always start with exactly one trigger node
- Position nodes vertically: y increases by 150 for each subsequent node, x stays at 250
- For branches, offset x by +200 or -200
- Connect nodes with edges using sourceNodeId and targetNodeId
- Use realistic config values based on the user's description
- Generate unique IDs like node-1, node-2, node-3 etc
- Edge IDs should be edge-1, edge-2 etc

Return ONLY valid JSON in this exact format, no markdown, no explanation:
{
  "name": "workflow name based on description",
  "description": "brief description",
  "nodes": [...],
  "edges": [{"id":"edge-1","sourceNodeId":"node-1","targetNodeId":"node-2","sourcePort":"output","targetPort":"input"}],
  "trigger": {"type":"manual|webhook|schedule","config":{}}
}`;

router.post("/generate", protect, async (req: AuthRequest, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt || prompt.trim().length < 5) {
      res
        .status(400)
        .json({ message: "Please provide a workflow description" });
      return;
    }

    const response = await client().chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      max_tokens: 2000,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Generate a workflow for: ${prompt}` },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const workflow = JSON.parse(raw);

    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      res.status(500).json({ message: "Failed to generate valid workflow" });
      return;
    }

    res.json({ workflow });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "AI generation failed" });
  }
});

export default router;
