import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectDB } from "./lib/db";
import logger from "./lib/logger";

const PORT = process.env.PORT || 3001;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    logger.info(`API running`, { port: PORT, url: `http://localhost:${PORT}` });
  });
};

start();
