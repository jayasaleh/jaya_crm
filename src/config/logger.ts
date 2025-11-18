import fs from "fs";
import path from "path";
import { createLogger, format, transports } from "winston";

const { combine, timestamp, printf, colorize, json } = format;

// Pastikan folder logs ada
const logDir = "logs";
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Format untuk console (berwarna)
const consoleFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] ${level}: ${message}`;
});

// Format untuk file logs
const fileFormat = combine(timestamp(), json());

export const logger = createLogger({
  level: "info",
  format: combine(timestamp()),
  transports: [
    // Console
    new transports.Console({
      format: combine(colorize(), consoleFormat),
    }),

    // File: Error only
    new transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      format: fileFormat,
    }),

    // File: Semua log
    new transports.File({
      filename: path.join(logDir, "combined.log"),
      format: fileFormat,
    }),
  ],
});
