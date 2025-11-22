// src/services/reportService.ts
import prisma from "../config/prisma";
import ApiError from "../utils/apiError";
import ExcelJS from "exceljs";

export async function getSalesReport(
  userId: number,
  role: string,
  startDate?: Date,
  endDate?: Date
) {
  // Build where clause for date filtering
  const dateFilter: any = {};
  if (startDate && endDate) {
    // Normalisasi endDate ke akhir hari
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);
    dateFilter.createdAt = { gte: startDate, lte: endOfDay };
  }

  // Role-based filtering: Sales hanya lihat data sendiri, Manager lihat semua
  const leadWhere = role === "MANAGER" ? dateFilter : { ...dateFilter, ownerId: userId };
  const dealWhere = role === "MANAGER" ? dateFilter : { ...dateFilter, ownerId: userId };

  // 1. Hitung Lead
  const totalLeads = await prisma.lead.count({
    where: leadWhere,
  });

  const convertedLeads = await prisma.lead.count({
    where: {
      ...leadWhere,
      status: "CONVERTED",
    },
  });

  // 2. Hitung Deal (hanya APPROVED dianggap closing)
  const totalDeals = await prisma.deal.count({
    where: dealWhere,
  });

  const approvedDealsWhere = {
    ...dealWhere,
    status: "APPROVED" as const,
  };

  const approvedDeals = await prisma.deal.count({
    where: approvedDealsWhere,
  });

  // Total revenue dari deal yang APPROVED
  const revenueResult = await prisma.deal.aggregate({
    where: approvedDealsWhere,
    _sum: {
      totalAmount: true,
    },
  });

  const totalRevenue = revenueResult._sum.totalAmount || 0;

  // 3. Produk Terlaris (dari DealItem di deal APPROVED)
  const dealItemWhere: any = {
    deal: {
      status: "APPROVED",
      ...(role === "SALES" ? { ownerId: userId } : {}),
    },
  };
  if (dateFilter.createdAt) {
    dealItemWhere.deal.createdAt = dateFilter.createdAt;
  }

  const topProductsResult = await prisma.dealItem.groupBy({
    by: ["productId"],
    where: dealItemWhere,
    _sum: {
      quantity: true,
      subtotal: true,
    },
    _count: {
      _all: true,
    },
    orderBy: {
      _sum: { subtotal: "desc" },
    },
    take: 5,
  });
  const productIds = topProductsResult.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
    },
    select: {
      id: true,
      name: true,
    },
  });

  const topProducts = topProductsResult.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return {
      productId: item.productId,
      name: product?.name || "Unknown Product",
      sold: item._sum.quantity || 0,
      revenue: item._sum.subtotal || 0,
    };
  });

  return {
    period: {
      startDate: startDate ? startDate.toISOString().split("T")[0] : "All Time",
      endDate: endDate ? endDate.toISOString().split("T")[0] : "All Time",
    },
    summary: {
      totalLeads,
      convertedLeads,
      conversionRate: totalLeads > 0 ? `${((convertedLeads / totalLeads) * 100).toFixed(2)}%` : "0.00%",
      totalDeals,
      approvedDeals,
      totalRevenue: Number(totalRevenue),
    },
    topProducts,
  };
}

export async function generateSalesReportExcel(
  userId: number,
  role: string,
  startDate?: Date,
  endDate?: Date
): Promise<Buffer> {
  if (!startDate || !endDate) {
    throw new ApiError(400, "startDate and endDate are required for Excel export");
  }
  const report = await getSalesReport(userId, role, startDate, endDate);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sales Report");

  // === Header ===
  worksheet.mergeCells("A1:D1");
  worksheet.getCell("A1").value = `Laporan Penjualan: ${report.period.startDate} - ${report.period.endDate}`;
  worksheet.getCell("A1").font = { size: 16, bold: true };
  worksheet.getCell("A1").alignment = { horizontal: "center" };

  // === Summary ===
  worksheet.addRow([]);
  worksheet.addRow(["METRIK", "NILAI"]);
  worksheet.addRow(["Total Leads", report.summary.totalLeads]);
  worksheet.addRow(["Converted Leads", report.summary.convertedLeads]);
  worksheet.addRow(["Conversion Rate", report.summary.conversionRate]);
  worksheet.addRow(["Total Deals", report.summary.totalDeals]);
  worksheet.addRow(["Approved Deals", report.summary.approvedDeals]);
  worksheet.addRow(["Total Revenue", `Rp ${report.summary.totalRevenue.toLocaleString("id-ID")}`]);

  // Style summary
  const summaryStart = 3;
  const summaryEnd = 9;
    for (let rowNumber = summaryStart; rowNumber <= summaryEnd; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    if (rowNumber === summaryStart) {
      row.eachCell(cell => {
        cell.font = { bold: true };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFEEEEEE" }
        };
      });
    }
    row.height = 20;
  }


  // === Top Products ===
  worksheet.addRow([]);
  worksheet.addRow(["PRODUK TERLARIS"]);
  worksheet.addRow(["Nama Produk", "Jumlah Terjual", "Revenue"]);
  
  report.topProducts.forEach(product => {
    worksheet.addRow([
      product.name,
      product.sold,
      `Rp ${product.revenue.toLocaleString("id-ID")}`
    ]);
  });

  // Style header produk
  const productHeaderRow = summaryEnd + 3;
  worksheet.getRow(productHeaderRow).eachCell(cell => {
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEEEEEE" }
    };
  });

  // Atur lebar kolom
  worksheet.getColumn(1).width = 30;
  worksheet.getColumn(2).width = 15;
  worksheet.getColumn(3).width = 20;

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Get Leads Report
 * Role-based: Sales hanya lihat leads mereka sendiri, Manager lihat semua
 */
export async function getLeadsReport(
  userId: number,
  role: string,
  startDate?: Date,
  endDate?: Date
) {
  // Build where clause for date filtering
  const dateFilter: any = {};
  if (startDate && endDate) {
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);
    dateFilter.createdAt = { gte: startDate, lte: endOfDay };
  }

  // Role-based filtering
  const leadWhere = role === "MANAGER" ? dateFilter : { ...dateFilter, ownerId: userId };

  const leads = await prisma.lead.findMany({
    where: leadWhere,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      contact: true,
      email: true,
      address: true,
      needs: true,
      source: true,
      status: true,
      createdAt: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Group by status
  const leadsByStatus = await prisma.lead.groupBy({
    by: ["status"],
    where: leadWhere,
    _count: { id: true },
  });

  const statusCounts: Record<string, number> = {
    NEW: 0,
    CONTACTED: 0,
    QUALIFIED: 0,
    CONVERTED: 0,
    LOST: 0,
  };

  leadsByStatus.forEach((item) => {
    statusCounts[item.status] = item._count.id;
  });

  return {
    period: {
      startDate: startDate ? startDate.toISOString().split("T")[0] : "All Time",
      endDate: endDate ? endDate.toISOString().split("T")[0] : "All Time",
    },
    summary: {
      total: leads.length,
      byStatus: statusCounts,
    },
    leads,
  };
}

/**
 * Generate Leads Report Excel
 */
export async function generateLeadsReportExcel(
  userId: number,
  role: string,
  startDate?: Date,
  endDate?: Date
): Promise<Buffer> {
  if (!startDate || !endDate) {
    throw new ApiError(400, "startDate and endDate are required for Excel export");
  }
  
  const report = await getLeadsReport(userId, role, startDate, endDate);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Leads Report");

  // === Header ===
  worksheet.mergeCells("A1:H1");
  worksheet.getCell("A1").value = `Laporan Leads: ${report.period.startDate} - ${report.period.endDate}`;
  worksheet.getCell("A1").font = { size: 16, bold: true };
  worksheet.getCell("A1").alignment = { horizontal: "center" };

  // === Summary ===
  worksheet.addRow([]);
  worksheet.addRow(["RINGKASAN"]);
  worksheet.addRow(["Total Leads", report.summary.total]);
  worksheet.addRow(["NEW", report.summary.byStatus.NEW]);
  worksheet.addRow(["CONTACTED", report.summary.byStatus.CONTACTED]);
  worksheet.addRow(["QUALIFIED", report.summary.byStatus.QUALIFIED]);
  worksheet.addRow(["CONVERTED", report.summary.byStatus.CONVERTED]);
  worksheet.addRow(["LOST", report.summary.byStatus.LOST]);

  // Style summary
  const summaryStart = 3;
  const summaryEnd = 9;
  for (let rowNumber = summaryStart; rowNumber <= summaryEnd; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    if (rowNumber === summaryStart) {
      row.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFEEEEEE" },
        };
      });
    }
    row.height = 20;
  }

  // === Leads Data ===
  worksheet.addRow([]);
  worksheet.addRow(["DATA LEADS"]);
  worksheet.addRow([
    "Name",
    "Contact",
    "Email",
    "Address",
    "Needs",
    "Source",
    "Status",
    "Created Date",
  ]);

  report.leads.forEach((lead) => {
    worksheet.addRow([
      lead.name,
      lead.contact,
      lead.email || "-",
      lead.address,
      lead.needs,
      lead.source,
      lead.status,
      new Date(lead.createdAt).toLocaleDateString("id-ID"),
    ]);
  });

  // Style header
  const dataHeaderRow = summaryEnd + 3;
  worksheet.getRow(dataHeaderRow).eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEEEEEE" },
    };
  });

  // Atur lebar kolom
  worksheet.getColumn(1).width = 25; // Name
  worksheet.getColumn(2).width = 15; // Contact
  worksheet.getColumn(3).width = 25; // Email
  worksheet.getColumn(4).width = 30; // Address
  worksheet.getColumn(5).width = 25; // Needs
  worksheet.getColumn(6).width = 15; // Source
  worksheet.getColumn(7).width = 15; // Status
  worksheet.getColumn(8).width = 15; // Created Date

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Get Customers Report
 * Role-based: Sales hanya lihat customers dari deals mereka, Manager lihat semua
 */
export async function getCustomersReport(
  userId: number,
  role: string,
  startDate?: Date,
  endDate?: Date
) {
  // Build where clause for date filtering
  const dateFilter: any = {};
  if (startDate && endDate) {
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);
    dateFilter.createdAt = { gte: startDate, lte: endOfDay };
  }

  // Role-based filtering for customers
  const customerWhere: any = {
    services: {
      some: {
        status: "ACTIVE",
        ...(dateFilter.createdAt ? { startDate: dateFilter.createdAt } : {}),
      },
    },
  };

  if (role === "SALES") {
    customerWhere.deals = {
      some: {
        ownerId: userId,
        status: "APPROVED",
        ...(dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {}),
      },
    };
  }

  const customers = await prisma.customer.findMany({
    where: customerWhere,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      customerCode: true,
      contact: true,
      email: true,
      address: true,
      createdAt: true,
      services: {
        where: {
          status: "ACTIVE",
        },
        select: {
          id: true,
          product: {
            select: {
              name: true,
              speedMbps: true,
            },
          },
          monthlyFee: true,
          status: true,
          startDate: true,
        },
      },
    },
  });

  // Calculate statistics
  const totalCustomers = customers.length;
  const totalServices = customers.reduce((sum, customer) => sum + customer.services.length, 0);
  const totalRevenue = customers.reduce((sum, customer) => {
    return sum + customer.services.reduce((serviceSum, service) => {
      return serviceSum + Number(service.monthlyFee);
    }, 0);
  }, 0);

  return {
    period: {
      startDate: startDate ? startDate.toISOString().split("T")[0] : "All Time",
      endDate: endDate ? endDate.toISOString().split("T")[0] : "All Time",
    },
    summary: {
      totalCustomers,
      totalServices,
      totalRevenue: Number(totalRevenue),
    },
    customers,
  };
}

/**
 * Generate Customers Report Excel
 */
export async function generateCustomersReportExcel(
  userId: number,
  role: string,
  startDate?: Date,
  endDate?: Date
): Promise<Buffer> {
  if (!startDate || !endDate) {
    throw new ApiError(400, "startDate and endDate are required for Excel export");
  }
  
  const report = await getCustomersReport(userId, role, startDate, endDate);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Customers Report");

  // === Header ===
  worksheet.mergeCells("A1:E1");
  worksheet.getCell("A1").value = `Laporan Customers: ${report.period.startDate} - ${report.period.endDate}`;
  worksheet.getCell("A1").font = { size: 16, bold: true };
  worksheet.getCell("A1").alignment = { horizontal: "center" };

  // === Summary ===
  worksheet.addRow([]);
  worksheet.addRow(["RINGKASAN"]);
  worksheet.addRow(["Total Customers", report.summary.totalCustomers]);
  worksheet.addRow(["Total Services", report.summary.totalServices]);
  worksheet.addRow(["Total Revenue", `Rp ${report.summary.totalRevenue.toLocaleString("id-ID")}`]);

  // Style summary
  const summaryStart = 3;
  const summaryEnd = 6;
  for (let rowNumber = summaryStart; rowNumber <= summaryEnd; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    if (rowNumber === summaryStart) {
      row.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFEEEEEE" },
        };
      });
    }
    row.height = 20;
  }

  // === Customers Data ===
  worksheet.addRow([]);
  worksheet.addRow(["DATA CUSTOMERS"]);
  
  report.customers.forEach((customer, index) => {
    if (index > 0) {
      worksheet.addRow([]); // Add spacing between customers
    }

    // Customer header
    worksheet.addRow([
      "Customer Name",
      customer.name,
      "",
      "Customer Code",
      customer.customerCode || "-",
    ]);
    worksheet.addRow([
      "Contact",
      customer.contact,
      "",
      "Email",
      customer.email || "-",
    ]);
    worksheet.addRow([
      "Address",
      customer.address,
      "",
      "Created Date",
      new Date(customer.createdAt).toLocaleDateString("id-ID"),
    ]);

    // Services header
    if (customer.services.length > 0) {
      worksheet.addRow([]);
      worksheet.addRow(["Services:"]);
      worksheet.addRow([
        "Package",
        "Speed",
        "Monthly Fee",
        "Status",
        "Start Date",
      ]);

      // Style services header
      const servicesHeaderRow = worksheet.rowCount;
      worksheet.getRow(servicesHeaderRow).eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE0E0E0" },
        };
      });

      customer.services.forEach((service) => {
        worksheet.addRow([
          service.product.name,
          service.product.speedMbps ? `${service.product.speedMbps} Mbps` : "-",
          `Rp ${Number(service.monthlyFee).toLocaleString("id-ID")}`,
          service.status,
          new Date(service.startDate).toLocaleDateString("id-ID"),
        ]);
      });
    }
  });

  // Atur lebar kolom
  worksheet.getColumn(1).width = 20;
  worksheet.getColumn(2).width = 30;
  worksheet.getColumn(3).width = 15;
  worksheet.getColumn(4).width = 20;
  worksheet.getColumn(5).width = 30;

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}