import { Request, Response } from "express";

import * as authService from "../services/auth.service";

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body;
  const result = await authService.registerUser({ name, email, password });
  return res.status(201).json({ data: result });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const result = await authService.loginUser(email, password);
  return res.status(200).json({ data: result });
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(400).json({ error: "refreshToken is required" });
  const tokens = await authService.refreshTokens(refreshToken);
  return res.status(200).json({ data: tokens });
}

// export async function me(req: Request, res: Response) {
//   // req.user is set by middleware
//   return res.status(200).json({ data: req.user });
// }
