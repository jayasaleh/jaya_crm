// src/controllers/customerController.ts
import { Request, Response } from "express";
import * as customerService from "../services/customerService";
import { asyncHandler } from "../middleware/asyncHandler";
import ApiResponse from "../utils/apiResponse";
import ApiError from "../utils/apiError";

/**
 * GET /api/customers
 * @access Sales (hanya customer-nya), Manager (semua)
 * @desc Tampilkan customer aktif (yang punya layanan berlangganan)
 */
export const getAllActiveCustomers = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  
  // Extract query params
  const filters = {
    search: req.query.search as string | undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  };

  const result = await customerService.getAllActiveCustomers(user.id, user.role, filters);
  res.status(200).json(new ApiResponse("Active customers fetched successfully", result));
});

/**
 * GET /api/customers/:id
 * @access Sales (hanya miliknya), Manager (semua)
 */
export const getActiveCustomerById = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const id = Number(req.params.id);
  if (isNaN(id) || id <= 0) throw new ApiError(400, "Invalid customer ID");

  const customer = await customerService.getActiveCustomerById(id, user.id, user.role);
  res.status(200).json(new ApiResponse("Customer fetched successfully", customer));
});