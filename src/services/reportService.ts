// src/services/reportService.ts
import prisma from "../config/prisma";
import ApiError from "../utils/apiError";
import ExcelJS from "exceljs";

export async function getSalesReport(startDate?: Date, endDate?: Date) {
  // Build where clause for date filtering
  const dateFilter: any = {};
  if (startDate && endDate) {
    // Normalisasi endDate ke akhir hari
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);
    dateFilter.createdAt = { gte: startDate, lte: endOfDay };
  }

  // 1. Hitung Lead
  const totalLeads = await prisma.lead.count({
    where: dateFilter,
  });

  const convertedLeads = await prisma.lead.count({
    where: {
      ...dateFilter,
      status: "CONVERTED",
    },
  });

  // 2. Hitung Deal (hanya APPROVED dianggap closing)
  const totalDeals = await prisma.deal.count({
    where: dateFilter,
  });

  const approvedDealsWhere = {
    ...dateFilter,
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

export async function generateSalesReportExcel(startDate?: Date, endDate?: Date): Promise<Buffer> {
  if (!startDate || !endDate) {
    throw new ApiError(400, "startDate and endDate are required for Excel export");
  }
  const report = await getSalesReport(startDate, endDate);

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