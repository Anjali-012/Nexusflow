import { Server } from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";
import { Logger } from "@hocuspocus/extension-logger";
import mongoose from "mongoose";
import * as Y from "yjs";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/nexusflow";
const PORT = Number(process.env.COLLAB_PORT) || 1234;

// Connect to MongoDB
mongoose.connect(MONGODB_URI).then(() => {
  console.log("MongoDB connected");
});

// Y.js state storage collection
const CollabSnapshot = mongoose.model(
  "CollabSnapshot",
  new mongoose.Schema({
    documentName: { type: String, required: true, unique: true },
    state: { type: Buffer },
    updatedAt: { type: Date, default: Date.now },
  }),
);

const server = Server.configure({
  port: PORT,

  async onAuthenticate({ token, documentName }) {
    // Verify JWT token
    const jwt = await import("jsonwebtoken");
    try {
      const decoded = jwt.default.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
        tenantId: string;
        role: string;
      };

      // Extract workflowId from documentName (format: workflow:workflowId)
      const workflowId = documentName.split(":")[1];
      if (!workflowId) throw new Error("Invalid document name");

      return {
        userId: decoded.userId,
        tenantId: decoded.tenantId,
        role: decoded.role,
      };
    } catch {
      throw new Error("Unauthorized");
    }
  },

  async onConnect({ documentName, context }) {
    console.log(`User ${context.userId} connected to ${documentName}`);
  },

  async onDisconnect({ documentName, context }) {
    console.log(`User ${context.userId} disconnected from ${documentName}`);
  },

  extensions: [
    new Logger(),
    new Database({
      fetch: async ({ documentName }) => {
        const snapshot = await CollabSnapshot.findOne({ documentName });
        return snapshot?.state ? Buffer.from(snapshot.state) : null;
      },
      store: async ({ documentName, state }) => {
        await CollabSnapshot.findOneAndUpdate(
          { documentName },
          { state: Buffer.from(state), updatedAt: new Date() },
          { upsert: true },
        );
      },
    }),
  ],
});

server.listen();
console.log(`Hocuspocus collab server running on port ${PORT}`);
