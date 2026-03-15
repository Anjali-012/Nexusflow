import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectDB } from "./lib/db";

const PORT = process.env.PORT || 3001;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`✅ API running → http://localhost:${PORT}`);
  });
};

start();
