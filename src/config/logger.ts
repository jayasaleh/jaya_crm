import { createLogger, format, transports } from "winston";

const { combine, timestamp, printf, colorize } = format;

// Format console
const consoleFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] ${level}: ${message}`;
});

export const logger = createLogger({
  level: "info",
  format: combine(timestamp()),
  transports: [
    new transports.Console({
      format: combine(colorize(), consoleFormat),
    }),
  ],
});
