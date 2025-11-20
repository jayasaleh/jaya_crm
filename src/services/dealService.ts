import prisma from "../config/prisma";
import  ApiError from "../utils/apiError";
import { logger } from "../config/logger";
import { Decimal } from "@prisma/client/runtime/library";

export async function createDeal(
  userId: number,
  data: {
    customerId: number;
    title?: string;
    items: { productId: number; agreedPrice: number; quantity: number }[];
  }
) {
  // Validasi awal di luar transaction (boleh, karena hanya read)
  const customer = await prisma.customer.findUnique({
    where: { id: data.customerId },
  });
  if (!customer) throw new ApiError(404, "Customer not found");

  // Validasi produk & hitung data (pure logic)
  let totalAmount = 0;
  let needsApproval = false;
  const validatedItems: {
    productId: number;
    quantity: number;
    agreedPrice: number;
    standardPrice: number;
    subtotal: number;
    needsApproval: boolean;
  }[] = [];

  for (const item of data.items) {
    if (item.quantity <= 0) {
      throw new ApiError(400, "Quantity must be greater than 0");
    }
    if (item.agreedPrice <= 0) {
      throw new ApiError(400, "Agreed price must be greater than 0");
    }

    // Ambil produk (akan diverifikasi ulang di dalam transaction)
    const product = await prisma.product.findUnique({
      where: { id: item.productId, isActive: true },
    });
    if (!product) {
      throw new ApiError(400, `Product ${item.productId} not found or inactive`);
    }

    const subtotal = item.agreedPrice * item.quantity;
    const itemNeedsApproval = item.agreedPrice < Number(product.sellingPrice);
    needsApproval = needsApproval || itemNeedsApproval;

    validatedItems.push({
      productId: item.productId,
      quantity: item.quantity,
      agreedPrice: item.agreedPrice,
      standardPrice: Number(product.sellingPrice),
      subtotal,
      needsApproval: itemNeedsApproval,
    });

    totalAmount += subtotal;
  }

  // 🔁 Mulai TRANSACTION
  return prisma.$transaction(async (tx) => {
    // Verifikasi ulang customer & produk dalam transaction (snapshot consistency)
    const customerInTx = await tx.customer.findUnique({
      where: { id: data.customerId },
    });
    if (!customerInTx) throw new ApiError(404, "Customer not found");

    // Buat Deal
    const deal = await tx.deal.create({
      data: {
        customerId: data.customerId,
        ownerId: userId,
        title: data.title || `Deal for ${customerInTx.name}`,
        totalAmount,
        status: needsApproval ? "WAITING_APPROVAL" : "DRAFT",
        items: {
          create: validatedItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            standardPrice: item.standardPrice,
            agreedPrice: item.agreedPrice,
            subtotal: item.subtotal,
            needsApproval: item.needsApproval,
          })),
        },
      },
      include: { items: true },
    });

    // Jika butuh approval, buat PriceApproval records
    if (needsApproval) {
      const approvalPromises = deal.items.map(async (item) => {
        if (item.needsApproval) {
          return tx.priceApproval.create({
            data: {
              dealId: deal.id,
              dealItemId: item.id,
              requestedById: userId,
              requestedPrice: item.agreedPrice,
              standardPrice: item.standardPrice,
              discountAmount: Number(item.standardPrice) - Number(item.agreedPrice),
              status: "PENDING",
            },
          });
        }
      }).filter(Boolean); // Hapus undefined

      await Promise.all(approvalPromises);
    }

    logger.info(`Deal ${deal.id} created for customer ${data.customerId} by user ${userId}`);
    return deal;
  });
}
export async function getAllDeals(userId: number, role: string) {
  return prisma.deal.findMany({
    where: role === "MANAGER" ? {} : { ownerId: userId },
    include: {
      customer: { select: { name: true, customerCode: true } },
      owner: { select: { name: true, email: true } },
      items: {
        include: {
          product: { select: { name: true, sellingPrice: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
/**
 * Ambil detail deal by ID + validasi akses
 */
export async function getDealById(id: number, userId: number, role: string) {
  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      customer: true,
      owner: { select: { name: true, role: true } },
      items: {
        include: {
          product: true,
          approval: {
            include: {
              approvedBy: { select: { name: true } },
              requestedBy: { select: { name: true } },
            },
          },
        },
      },
      approvals: {
        include: {
          approvedBy: { select: { name: true } },
          requestedBy: { select: { name: true } },
        },
      },
    },
  });

  if (!deal) throw new ApiError(404, "Deal not found");

  // Sales hanya boleh akses deal miliknya
  if (role !== "MANAGER" && deal.ownerId !== userId) {
    throw new ApiError(403, "Access denied");
  }

  return deal;
}
/**
 * Manager: Approve deal
 */
export async function approveDeal(id: number, managerId: number, note?: string) {
  // Cek deal valid dan butuh approval
  const deal = await prisma.deal.findUnique({
    where: { id, status: "WAITING_APPROVAL" },
  });
  if (!deal) {
    throw new ApiError(400, "Deal not found or not in WAITING_APPROVAL status");
  }

  return prisma.$transaction(async (tx) => {
    // Update semua approval terkait
    await tx.priceApproval.updateMany({
      where: { dealId: id, status: "PENDING" },
        data: {
        status: "APPROVED",
        approvedById: managerId,
        decisionNote: note,
        decidedAt: new Date(),
      },
    });

    // Update deal status
    return tx.deal.update({
      where: { id },
        data: {
        status: "APPROVED",
        approvedAt: new Date(),
      },
    });
  });
}

/**
 * Manager: Reject deal
 */
export async function rejectDeal(id: number, managerId: number, note?: string) {
  const deal = await prisma.deal.findUnique({
    where: { id, status: "WAITING_APPROVAL" },
  });
  if (!deal) {
    throw new ApiError(400, "Deal not found or not in WAITING_APPROVAL status");
  }

  return prisma.$transaction(async (tx) => {
    await tx.priceApproval.updateMany({
      where: { dealId: id, status: "PENDING" },
        data: {
        status: "REJECTED",
        approvedById: managerId,
        decisionNote: note,
        decidedAt: new Date(),
      },
    });

    return tx.deal.update({
      where: { id },
        data: {
        status: "REJECTED",
        rejectedAt: new Date(),
      },
    });
  });
}