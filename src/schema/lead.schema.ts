import { z } from "zod";

// Untuk params (misal: /:id)
export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a number"),
});

// Schema untuk BODY — langsung, seperti registerSchema
export const createLeadSchema = z.object({
  name: z.string().min(1, "Lead name is required"),
  contact: z.string().min(5, "Contact is required"),  
  address: z.string().min(3, "Address is required"),
  needs: z.string().min(3, "Needs is required"),
  source: z.enum(["WEBSITE", "WALKIN", "PARTNER", "REFERRAL", "OTHER"]).default("OTHER"),
  // status biasanya tidak di-set saat create → default "NEW" via Prisma/service
});

export const updateLeadSchema = z.object({
  name: z.string().min(1).optional(),
  contact: z.string().optional(),
  address: z.string().optional(),
  needs: z.string().optional(),
  status: z.enum(["NEW", "FOLLOW_UP", "QUALIFIED", "CONVERTED", "CONTACTED"]).optional(),
  source: z.enum(["WEBSITE", "WALKIN", "PARTNER", "REFERRAL", "OTHER"]).optional(),
});