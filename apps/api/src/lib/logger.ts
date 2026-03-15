import winston from "winston";

const isProduction = process.env.NODE_ENV === "production";

const logger = winston.createLogger({
  level: isProduction ? "info" : "debug",
  format: isProduction
    ? winston.format.combine(winston.format.timestamp(), winston.format.json())
    : winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: "HH:mm:ss" }),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length
            ? ` ${JSON.stringify(meta)}`
            : "";
          return `${timestamp} [${level}]: ${message}${metaStr}`;
        }),
      ),
  transports: [new winston.transports.Console()],
});

export default logger;
