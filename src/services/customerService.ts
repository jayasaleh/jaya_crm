// src/services/customerService.ts
import prisma from "../config/prisma";
import ApiError from "../utils/apiError";

/**
 * Ambil semua customer aktif (yang punya minimal 1 Service aktif)
 */
export async function getAllActiveCustomers(
  userId: number,
  role: string,
  filters?: {
    search?: string;
    page?: number;
    limit?: number;
  }
) {
  const customerWhere: any = {
    deals: {
      some: { status: "APPROVED" },
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

  // Search by name, customerCode, email, atau contact
  if (filters?.search) {
    customerWhere.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { customerCode: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
      { contact: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  // Pagination
  const page = filters?.page || 1;
  const limit = filters?.limit || 10;
  const skip = (page - 1) * limit;

  // Get total count for pagination
  const total = await prisma.customer.count({
    where: customerWhere,
  });

  // Get customers with pagination
  const customers = await prisma.customer.findMany({
    where: customerWhere,
    include: {
      services: {
        where: { status: "ACTIVE" },
        include: {
          product: true,
        },
        orderBy: { startDate: "desc" },
      },
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
    skip,
    take: limit,
  });

  return {
    data: customers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
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