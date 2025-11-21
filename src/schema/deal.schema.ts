import { z } from "zod";

// Item dalam deal
const dealItemSchema = z.object({
  productId: z.number().int().positive(),
  agreedPrice: z.number().positive(),
  quantity: z.number().int().positive().default(1),
});

export const createDealSchema = z.object({
  leadId: z.number().int().positive().optional(),
  customerId: z.number().int().positive().optional(),
  title: z.string().min(1).optional(),
  items: z.array(dealItemSchema).min(1, "At least one product is required"),
}).refine(
  (data) => data.leadId || data.customerId,
  {
    message: "Either leadId or customerId must be provided",
    path: ["leadId", "customerId"],
  }
);

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a number"),
});

export const approvalActionSchema = z.object({
  note: z.string().optional(),
});
