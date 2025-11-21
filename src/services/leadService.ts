import prisma from "../config/prisma";
import ApiError from "../utils/apiError";
import { logger } from "../config/logger";
import { error } from "console";

export async function createLead(data: any) {
  return prisma.lead.create({ data });
}

export async function getAllLeads(userId: number, role: string) {
  if (role === "MANAGER") {
    return prisma.lead.findMany({ orderBy: { id: "asc" } });
  }
  return prisma.lead.findMany({
    where: { ownerId: userId },
    orderBy: { id: "asc" },
  });
}

export async function getLeadById(id: number, userId: number, role: string) {
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) throw new ApiError(404, "Lead not found");

  if (role !== "MANAGER" && lead.ownerId !== userId) {
    throw new ApiError(403, "Access denied");
  }

  return lead;
}

export async function updateLead(
  id: number,
  data: any,
  userId: number,
  role: string
) {

  await getLeadById(id, userId, role);
  return prisma.lead.update({ where: { id }, data });
}

export async function deleteLead(id: number, userId: number, role: string) {
  // Cek akses & eksistensi
  await getLeadById(id, userId, role);
  await prisma.lead.delete({ where: { id } });
  return { message: "Lead deleted" };
}

// Convert Lead ke Customer (hanya MANAGER)
export async function convertLeadToCustomer(leadId: number, role: string) {
  if (role !== "MANAGER") {
    throw new ApiError(403, "Only managers can convert leads");
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new ApiError(404, "Lead not found");

   if (lead.status !== "QUALIFIED") {
    throw new ApiError(400, "Only QUALIFIED leads can be converted to customer");
  }

  // Buat customer
  const customer = await prisma.customer.create({
    data: {
      name: lead.name,
      contact: lead.contact,
      address: lead.address || "",
    },
  });

  // Update lead
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: "CONVERTED",
      customerId: customer.id,
      convertedAt: new Date(),
    },
  });

  logger.info(`Lead ${leadId} converted to customer ${customer.id}`);

  return customer;
}