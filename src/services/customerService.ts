// src/services/customerService.ts
import prisma from "../config/prisma";
import ApiError from "../utils/apiError";

/**
 * Ambil semua customer aktif (yang punya minimal 1 Service aktif)
 */
export async function getAllActiveCustomers(userId: number, role: string) {
  const customerWhere: any = {
    deals: {
      some: { status: "APPROVED" }, // ← CUKUP approved!
    },
  };

  if (role === "SALES") {
    customerWhere.deals = {
      some: { 
        status: "APPROVED",
        ownerId: userId 
      },
    };
  }

  return prisma.customer.findMany({
    where: customerWhere,
    include: {
      deals: {
        where: { status: "APPROVED" },
        include: {
          items: {
            include: { product: true }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });
}
/**
 * Ambil detail customer by ID + validasi akses
 */
export async function getActiveCustomerById(id: number, userId: number, role: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      lead: { select: { ownerId: true } },
      deals: { where: { status: "APPROVED" }, select: { ownerId: true } },
      services: {
        where: { status: "ACTIVE" },
        include: {
          product: true,
        },
      },
    },
  });

  if (!customer) throw new ApiError(404, "Customer not found");

  // Cek akses untuk Sales
  if (role === "SALES") {
    const isOwner =
      customer.lead?.ownerId === userId ||
      customer.deals.some(deal => deal.ownerId === userId);
    if (!isOwner) {
      throw new ApiError(403, "Access denied");
    }
  }

  return customer;
}