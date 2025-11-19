import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  hpp: z.number().positive("HPP must be a positive number"),
  marginPercent: z
    .number()
    .min(0, "Margin cannot be negative")
    .max(100, "Margin cannot exceed 100%"),
  speedMbps: z.number().int().positive("Speed must be a positive integer").optional(),
  bandwidth: z.string().optional(),
 
});

export const updateProductSchema = createProductSchema.partial().extend({
  id: z.number().int().positive(),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a number"),
});