import prisma from "../config/prisma";
import  ApiError from "../utils/apiError";
import { logger } from "../config/logger";
import { Decimal } from "@prisma/client/runtime/library";

export async function createDeal(
  userId: number,
  data: {
    leadId?: number;
    customerId?: number;
    title?: string;
    items: { productId: number; agreedPrice: number; quantity: number }[];
  }
) {
  // Validasi: minimal salah satu (leadId atau customerId) harus ada
  if (!data.leadId && !data.customerId) {
    throw new ApiError(400, "Either leadId or customerId must be provided");
  }

  // Jika leadId diberikan, validasi Lead
  let lead = null;
  if (data.leadId) {
    lead = await prisma.lead.findUnique({
      where: { id: data.leadId },
    });
    if (!lead) throw new ApiError(404, "Lead not found");
    if (lead.status !== "QUALIFIED") {
      throw new ApiError(400, "Only QUALIFIED leads can be converted to deal");
    }
    if (lead.ownerId !== userId) {
      throw new ApiError(403, "You can only create deal from your own leads");
    }
  }

  // Jika customerId diberikan, validasi Customer
  let customer = null;
  if (data.customerId) {
    customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });
    if (!customer) throw new ApiError(404, "Customer not found");
  }

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

  
  return prisma.$transaction(async (tx) => {
    let customerInTx = customer;
    let createdCustomer = false;

    // Jika create dari Lead, auto-create Customer
    if (data.leadId && lead) {
      // Verifikasi ulang Lead dalam transaction
      const leadInTx = await tx.lead.findUnique({
        where: { id: data.leadId },
      });
      if (!leadInTx) throw new ApiError(404, "Lead not found");
      if (leadInTx.status !== "QUALIFIED") {
        throw new ApiError(400, "Lead status must be QUALIFIED");
      }

      // Auto-create Customer dari Lead
      customerInTx = await tx.customer.create({
        data: {
          name: leadInTx.name,
          contact: leadInTx.contact,
          email: leadInTx.email || null,
          address: leadInTx.address || null,
        },
      });
      createdCustomer = true;

      // Update Lead statusCONVERTED
      await tx.lead.update({
        where: { id: data.leadId },
        data: {
          status: "CONVERTED",
          customerId: customerInTx.id,
          convertedAt: new Date(),
        },
      });
    } else if (data.customerId) {
      // Verifikasi ulang customer dalam transaction
      customerInTx = await tx.customer.findUnique({
        where: { id: data.customerId },
      });
      if (!customerInTx) throw new ApiError(404, "Customer not found");
    }

    // Buat Deal
    const deal = await tx.deal.create({
      data: {
        leadId: data.leadId || null,
        customerId: customerInTx.id,
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

    if (data.leadId) {
      logger.info(`Deal ${deal.id} created from lead ${data.leadId} by user ${userId}. Customer ${customerInTx.id} auto-created.`);
    } else {
      logger.info(`Deal ${deal.id} created for customer ${data.customerId} by user ${userId}`);
    }
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
 * Sales: Submit deal for approval
 * Update status DRAFT → WAITING_APPROVAL
 */
export async function submitDeal(id: number, userId: number, role: string) {
  // Cek deal exists dan status = DRAFT
  const deal = await prisma.deal.findUnique({
    where: { id, status: "DRAFT" },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!deal) {
    throw new ApiError(400, "Deal not found or not in DRAFT status");
  }

  // Validasi akses: Sales hanya bisa submit deal miliknya
  if (role !== "MANAGER" && deal.ownerId !== userId) {
    throw new ApiError(403, "Access denied. You can only submit your own deals");
  }

  // Cek apakah ada item yang butuh approval
  const hasItemsNeedingApproval = deal.items.some(item => item.needsApproval);

  return prisma.$transaction(async (tx) => {
    // Jika ada item yang butuh approval, buat PriceApproval records
    if (hasItemsNeedingApproval) {
      const approvalPromises = deal.items
        .filter(item => item.needsApproval)
        .map(item => {
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
        });

      await Promise.all(approvalPromises);
    }

    // Update deal status ke WAITING_APPROVAL
    const updatedDeal = await tx.deal.update({
      where: { id },
      data: {
        status: "WAITING_APPROVAL",
        submittedAt: new Date(),
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    logger.info(`Deal ${id} submitted for approval by user ${userId}`);
    return updatedDeal;
  });
}

/**
 * Activate Deal Services
 * Create Service untuk setiap DealItem dari Deal yang sudah APPROVED
 * @access Sales (hanya miliknya), Manager (semua)
 */
export async function activateDealServices(id: number, userId: number, role: string) {
  // Cek deal exists dan status = APPROVED
  const deal = await prisma.deal.findUnique({
    where: { id, status: "APPROVED" },
    include: {
      customer: {
        include: {
          services: {
            where: {
              status: "ACTIVE",
            },
          },
        },
      },
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!deal) {
    throw new ApiError(400, "Deal not found or not in APPROVED status");
  }

  // Validasi akses: Sales hanya bisa activate deal miliknya
  if (role !== "MANAGER" && deal.ownerId !== userId) {
    throw new ApiError(403, "Access denied. You can only activate your own deals");
  }

  // Validasi customer exists
  if (!deal.customer) {
    throw new ApiError(400, "Customer not found for this deal");
  }

  // Cek apakah sudah ada service aktif untuk customer ini (opsional check)
  // Note: Bisa saja customer punya multiple deals, jadi kita tidak cek duplicate service
  // Tapi kita bisa cek apakah deal ini sudah pernah di-activate dengan cara lain

  return prisma.$transaction(async (tx) => {
    // Create Service untuk setiap DealItem
    const servicePromises = deal.items.map(item => {
      return tx.service.create({
        data: {
          customerId: deal.customerId!,
          productId: item.productId,
          monthlyFee: item.agreedPrice,
          installationFee: null, // Bisa di-set kemudian jika perlu
          status: "ACTIVE",
          startDate: new Date(),
          installationAddress: deal.customer.address || null,
          installationNotes: `Service activated from Deal ${deal.dealNumber}`,
        },
      });
    });

    const createdServices = await Promise.all(servicePromises);

    logger.info(`Deal ${id} activated: ${createdServices.length} services created for customer ${deal.customerId}`);

    // Return deal dengan services yang sudah dibuat
    const updatedDeal = await tx.deal.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            services: {
              where: {
                status: "ACTIVE",
              },
              include: {
                product: true,
              },
            },
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return updatedDeal;
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