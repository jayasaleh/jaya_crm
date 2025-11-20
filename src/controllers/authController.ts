import { Request, Response } from "express";
import * as authService from "../services/authService";
import { asyncHandler } from "../middleware/asyncHandler";
import { logger } from "../config/logger"; // pastikan path sesuai

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  logger.info(`Login attempt for email: ${email}`);

  const result = await authService.loginUser(req.body.email, req.body.password);

  logger.info(`Login successful for email: ${email}`);
  res.status(200).json({ code: 200, status: "success", message: "Login successful", data: result });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    logger.warn("Refresh token missing in request");
    return res.status(400).json({ code: 400, status: "error", message: "refreshToken is required" });
  }

  logger.info("Refresh token request received");
  const tokens = await authService.refreshTokens(refreshToken);

  logger.info("Refresh token successful");
  res.status(200).json({ code: 200, status: "success", message: "Tokens refreshed successfully", data: tokens });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
    const user=(req as any).user;
  logger.info(`Me endpoint accessed by user: ${user.email}`);
  res.status(200).json({ code: 200, status: "success", message: "User updated successfully", data: user});
});
