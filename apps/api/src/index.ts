import express from "express";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./lib/db";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "nexusflow-api",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`✅ API running → http://localhost:${PORT}`);
  });
};

start();
