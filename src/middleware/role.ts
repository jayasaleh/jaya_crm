import { Request, Response, NextFunction } from "express";

type AuthRequest = Request & { user?: { id: number; role: string } };

export function roleMiddleware(roles: string | string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(user.role!)) {
      return res.status(403).json({ error: "Forbidden: Insufficient role" });
    }

    next();
  };
}