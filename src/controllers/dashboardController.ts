import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import * as dashboardService from "../services/dashboardService";
import ApiResponse from "../utils/apiResponse";
import { logger } from "../config/logger";

/**
 * GET /api/dashboard/stats
 * @access Sales (hanya data sendiri), Manager (semua data)
 */
export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  logger.info(`Fetching dashboard stats for user ${user.id} (${user.role})`);

  const stats = await dashboardService.getDashboardStats(user.id, user.role);
  res.status(200).json(new ApiResponse("Dashboard statistics fetched successfully", stats));
});

