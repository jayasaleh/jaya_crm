// src/controllers/productController.ts
import { Request, Response } from "express";
import * as productService from "../services/productService";
import { asyncHandler } from "../middleware/asyncHandler";
import { logger } from "../config/logger";
import ApiResponse from "../utils/apiResponse";
import ApiError from "../utils/apiError";

/**
 * @POST /api/products
 * @access Manager only
 */
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  logger.info(`Product creation request by user ${user.id}`);

  const product = await productService.createProduct(req.body);
  res.status(201).json(new ApiResponse("Product created successfully", product));
});

/**
 * @GET /api/products
 * @access All authenticated users (Sales & Manager)
 */
export const getAllProducts = asyncHandler(async (_req: Request, res: Response) => {
  const products = await productService.getAllProducts();
  res.json(new ApiResponse("Products fetched successfully", products));
});

/**
 * @GET /api/products/:id
 * @access All authenticated users
 */

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id) || id <= 0) {
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await productService.getProductById(id);
  res.json(new ApiResponse("Product fetched successfully", product));
});

/**
 * @PATCH /api/products/:id
 * @access Manager only
 */
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id) || id <= 0) {
    throw new ApiError(400, "Invalid product ID");
  }

  logger.info(`Update product request for ID ${id}`);
  const updated = await productService.updateProduct(id, req.body);
  res.json(new ApiResponse("Product updated successfully", updated));
});

/**
 * @DELETE /api/products/:id
 * @access Manager only
 * Note: Soft delete (set isActive = false)
 */
export const deactivateProduct = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id) || id <= 0) {
    throw new ApiError(400, "Invalid product ID");
  }

  logger.info(`Deactivate product request for ID ${id}`);
  await productService.deactivateProduct(id);
  res.json(new ApiResponse("Product deactivated successfully"));
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id) || id <= 0) {
    throw new ApiError(400, "Invalid product ID");
  }

  logger.info(`Delete product request for ID ${id}`);
  await productService.deleteProduct(id);
  res.json(new ApiResponse("Product deleted successfully"));
})