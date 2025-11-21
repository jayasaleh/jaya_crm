import prisma from "../config/prisma";
import { logger } from "../config/logger";

/**
 * Get Dashboard Statistics
 * Role-based: Sales hanya lihat data sendiri, Manager lihat semua
 */
export async function getDashboardStats(userId: number, role: string) {
  logger.info(`Fetching dashboard stats for user ${userId} (${role})`);

  // Base where clause untuk filter berdasarkan role
  const leadWhere = role === "MANAGER" ? {} : { ownerId: userId };
  const dealWhere = role === "MANAGER" ? {} : { ownerId: userId };

  // 1. Total Leads (per status)
  const leadsByStatus = await prisma.lead.groupBy({
    by: ["status"],
    where: leadWhere,
    _count: {
      id: true,
    },
  });

  const totalLeads = await prisma.lead.count({
    where: leadWhere,
  });

  // Format leads by status
  const leadsStats = {
    total: totalLeads,
    byStatus: {
      NEW: 0,
      CONTACTED: 0,
      QUALIFIED: 0,
      CONVERTED: 0,
      LOST: 0,
    },
  };

  leadsByStatus.forEach((item) => {
    leadsStats.byStatus[item.status as keyof typeof leadsStats.byStatus] = item._count.id;
  });

  // 2. Total Deals (per status)
  const dealsByStatus = await prisma.deal.groupBy({
    by: ["status"],
    where: dealWhere,
    _count: {
      id: true,
    },
  });

  const totalDeals = await prisma.deal.count({
    where: dealWhere,
  });

  // Format deals by status
  const dealsStats = {
    total: totalDeals,
    byStatus: {
      DRAFT: 0,
      WAITING_APPROVAL: 0,
      APPROVED: 0,
      REJECTED: 0,
    },
  };

  dealsByStatus.forEach((item) => {
    dealsStats.byStatus[item.status as keyof typeof dealsStats.byStatus] = item._count.id;
  });

  // 3. Total Customers (yang punya Service aktif)
  const customerWhere: any = {
    services: {
      some: {
        status: "ACTIVE",
      },
    },
  };

  if (role === "SALES") {
    customerWhere.deals = {
      some: {
        ownerId: userId,
        status: "APPROVED",
      },
    };
  }

  const totalCustomers = await prisma.customer.count({
    where: customerWhere,
  });

  // 4. Total Revenue (dari Deal yang APPROVED)
  const revenueResult = await prisma.deal.aggregate({
    where: {
      ...dealWhere,
      status: "APPROVED",
    },
    _sum: {
      totalAmount: true,
    },
  });

  const totalRevenue = Number(revenueResult._sum.totalAmount || 0);

  // 5. Pending Approvals count (deal dengan status WAITING_APPROVAL)
  const pendingApprovals = await prisma.deal.count({
    where: {
      ...dealWhere,
      status: "WAITING_APPROVAL",
    },
  });

  // 6. Additional stats: Recent activity
  const recentLeads = await prisma.lead.findMany({
    where: leadWhere,
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      name: true,
      status: true,
      createdAt: true,
    },
  });

  const recentDeals = await prisma.deal.findMany({
    where: dealWhere,
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      dealNumber: true,
      status: true,
      totalAmount: true,
      createdAt: true,
      customer: {
        select: {
          name: true,
        },
      },
    },
  });

  return {
    leads: leadsStats,
    deals: dealsStats,
    customers: {
      total: totalCustomers,
    },
    revenue: {
      total: totalRevenue,
    },
    pendingApprovals,
    recentActivity: {
      leads: recentLeads,
      deals: recentDeals,
    },
  };
}

