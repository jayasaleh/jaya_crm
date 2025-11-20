import { asyncHandler } from "../middleware/asyncHandler";
import { Request, Response } from "express";
import * as dealService from "../services/dealService";
import ApiResponse from "../utils/apiResponse";
import { logger } from "../config/logger";
import ApiError from "../utils/apiError";


export const createDeal = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const deal = await dealService.createDeal(user.id, req.body);
  res.status(201).json(new ApiResponse("Deal created successfully", deal));
});

export const getAllDeals = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  logger.info(`Fetching deals for user ${user.id} (${user.role})`);

  const deals = await dealService.getAllDeals(user.id, user.role);
  res.json(new ApiResponse("Deals fetched successfully", deals));
});

/**
 * GET /api/deals/:id
 * @access Sales (hanya miliknya), Manager (semua)
 */
export const getDealById = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const id = Number(req.params.id);
  if (isNaN(id) || id <= 0) throw new ApiError(400, "Invalid deal ID");

  logger.info(`Fetching deal ${id} by user ${user.id}`);
  const deal = await dealService.getDealById(id, user.id, user.role);
  res.json(new ApiResponse("Deal fetched successfully", deal));
});

/**
 * PATCH /api/deals/:id/approve
 * @access Manager only
 */
export const approveDeal = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const id = Number(req.params.id);
  if (isNaN(id) || id <= 0) throw new ApiError(400, "Invalid deal ID");

  const { note } = req.body;
  logger.info(`Approving deal ${id} by manager ${user.id}`);

  const approvedDeal = await dealService.approveDeal(id, user.id, note);
  res.json(new ApiResponse("Deal approved successfully", approvedDeal));
});

/**
 * PATCH /api/deals/:id/reject
 * @access Manager only
 */
export const rejectDeal = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const id = Number(req.params.id);
  if (isNaN(id) || id <= 0) throw new ApiError(400, "Invalid deal ID");

  const { note } = req.body;
  logger.info(`Rejecting deal ${id} by manager ${user.id}`);

  const rejectedDeal = await dealService.rejectDeal(id, user.id, note);
  res.json(new ApiResponse("Deal rejected successfully", rejectedDeal));
});