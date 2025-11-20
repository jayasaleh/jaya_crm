import { z } from "zod";

// Item dalam deal
const dealItemSchema = z.object({
  productId: z.number().int().positive(),
  agreedPrice: z.number().positive(),
  quantity: z.number().int().positive().default(1),
});

export const createDealSchema = z.object({
  customerId: z.number().int().positive(),
  title: z.string().min(1).optional(),
  items: z.array(dealItemSchema).min(1, "At least one product is required"),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a number"),
});

export const approvalActionSchema = z.object({
  note: z.string().optional(),
});
