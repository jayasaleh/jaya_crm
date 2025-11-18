import { Request, Response, NextFunction } from "express";

export const asyncHandler =
  (fn: any) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (err: any) {
      const status = err.status || 500;
      const message = err.message || "Internal Server Error";

      return res.status(status).json({ error: message });
    }
  };
