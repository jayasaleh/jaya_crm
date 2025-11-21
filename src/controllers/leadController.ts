import { Request, Response } from "express";
import * as leadService from "../services/leadService";
import { asyncHandler } from "../middleware/asyncHandler";
import { logger } from "../config/logger";
import ApiResponse from "../utils/apiResponse";
import ApiError from "../utils/apiError";

export const createLead = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  logger.info(`Lead creation request by user ${user.id}`);

  const lead = await leadService.createLead({
    ...req.body,
    ownerId: user.id,
  });

  res.status(201).json(new ApiResponse("Lead created successfully", lead));
});

export const getAllLeads = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  logger.info(`Fetching leads for user=${user.id}`);

  // Extract query params
  const filters = {
    status: req.query.status as string | undefined,
    source: req.query.source as string | undefined,
    search: req.query.search as string | undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  };

  const result = await leadService.getAllLeads(user.id, user.role, filters);

  res.status(200).json(new ApiResponse("Leads fetched successfully", result));
});

export const getLeadById = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const id = Number(req.params.id);

  logger.info(`Fetching lead id=${id}`);

  const lead = await leadService.getLeadById(id, user.id, user.role);

  res.status(200).json(new ApiResponse("Lead fetched successfully", lead));
});

export const updateLead = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const id = Number(req.params.id);

  logger.info(`Updating lead id=${id}`);

  const updated = await leadService.updateLead(id, req.body, user.id, user.role);

  res.status(200).json(new ApiResponse("Lead updated successfully", updated));
});

export const deleteLead = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const id = Number(req.params.id);

  logger.info(`Deleting lead id=${id} by user=${user.id}`);
  await leadService.deleteLead(id, user.id, user.role);

  res.status(200).json(new ApiResponse("Lead deleted successfully"));
});

export const convertLead = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const id = Number(req.params.id);

  logger.info(`Converting lead id=${id} by user=${user.id} (role: ${user.role})`);

  const customer = await leadService.convertLeadToCustomer(id, user.role);

  res.status(200).json(new ApiResponse("Lead converted to customer", customer));
});