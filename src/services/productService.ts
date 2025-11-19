// src/services/productService.ts
import prisma from "../config/prisma";
import ApiError from "../utils/apiError";
import { logger } from "../config/logger";

function calculateSellingPrice(hpp: number, marginPercent: number): number {
  return Number((hpp * (1 + marginPercent / 100)).toFixed(2));
}

export async function createProduct(data: {
  name: string;
  description?: string;
  hpp: number;
  marginPercent: number;
  speedMbps?: number;
  bandwidth?: string;
  isActive?: boolean;
}) {
  const sellingPrice = calculateSellingPrice(data.hpp, data.marginPercent);

  logger.info(`Creating product: ${data.name}`);

  return prisma.product.create({
    data: {
      ...data,
      sellingPrice,
    },
  });
}

export async function getAllProducts() {
  return prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function getProductById(id: number) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new ApiError(404, "Product not found");
  return product;
}


export async function updateProduct(id: number, input: any) {
  const existing = await getProductById(id);

  const updateData: Record<string, any> = {};

 
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.speedMbps !== undefined) updateData.speedMbps = input.speedMbps;
  if (input.bandwidth !== undefined) updateData.bandwidth = input.bandwidth;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;

  
  if (input.hpp !== undefined || input.marginPercent !== undefined) {
    const newHpp = input.hpp ?? existing.hpp;
    const newMargin = input.marginPercent ?? existing.marginPercent;
    updateData.hpp = newHpp;
    updateData.marginPercent = newMargin;
    updateData.sellingPrice = Number((newHpp * (1 + newMargin / 100)).toFixed(2));
  }

  logger.info(`Updating product ${id}`);

  return prisma.product.update({
    where: { id },
    data: updateData,
  });
}

export async function deactivateProduct(id: number) {
  logger.info(`Deactivating product ${id}`);
  return prisma.product.update({
    where: { id },
    data: { isActive: false }, // ← perbaiki struktur
  });
}