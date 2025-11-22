import { Request, Response } from "express";
import * as reportService from "../services/reportService";
import { asyncHandler } from "../middleware/asyncHandler";
import ApiResponse from "../utils/apiResponse";
import ApiError from "../utils/apiError";

type AuthRequest = Request & { user?: { id: number; role: string } };

const parseDateRange = (startDate?: string, endDate?: string) => {
  let start: Date | undefined;
  let end: Date | undefined;

  if (startDate || endDate) {
    if (!startDate || !endDate) {
      throw new ApiError(400, "Both 'startDate' and 'endDate' are required when filtering (format: YYYY-MM-DD)");
    }

    start = new Date(startDate);
    end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ApiError(400, "Invalid date format. Use YYYY-MM-DD");
    }

    if (start > end) {
      throw new ApiError(400, "startDate cannot be after endDate");
    }
  }

  return { start, end };
};

export const getSalesReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { startDate, endDate } = req.query;
  const { start, end } = parseDateRange(startDate as string, endDate as string);

  if (!req.user) {
    throw new ApiError(401, "Unauthorized");
  }

  const report = await reportService.getSalesReport(req.user.id, req.user.role, start, end);
  res.json(new ApiResponse("Sales report generated successfully", report));
});

export const getSalesReportExcel = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    throw new ApiError(400, "Query params 'startDate' and 'endDate' are required (format: YYYY-MM-DD)");
  }

  const { start, end } = parseDateRange(startDate as string, endDate as string);

  if (!req.user) {
    throw new ApiError(401, "Unauthorized");
  }

  const excelBuffer = await reportService.generateSalesReportExcel(req.user.id, req.user.role, start, end);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="Laporan_Penjualan_${start!.toISOString().split("T")[0]}_sd_${end!.toISOString().split("T")[0]}.xlsx"`
  );

  res.send(excelBuffer);
});

export const getLeadsReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { startDate, endDate } = req.query;
  const { start, end } = parseDateRange(startDate as string, endDate as string);

  if (!req.user) {
    throw new ApiError(401, "Unauthorized");
  }

  const report = await reportService.getLeadsReport(req.user.id, req.user.role, start, end);
  res.json(new ApiResponse("Leads report generated successfully", report));
});

export const getCustomersReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { startDate, endDate } = req.query;
  const { start, end } = parseDateRange(startDate as string, endDate as string);

  if (!req.user) {
    throw new ApiError(401, "Unauthorized");
  }

  const report = await reportService.getCustomersReport(req.user.id, req.user.role, start, end);
  res.json(new ApiResponse("Customers report generated successfully", report));
});

export const getLeadsReportExcel = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    throw new ApiError(400, "Query params 'startDate' and 'endDate' are required (format: YYYY-MM-DD)");
  }

  const { start, end } = parseDateRange(startDate as string, endDate as string);

  if (!req.user) {
    throw new ApiError(401, "Unauthorized");
  }

  const excelBuffer = await reportService.generateLeadsReportExcel(req.user.id, req.user.role, start, end);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="Laporan_Leads_${start!.toISOString().split("T")[0]}_sd_${end!.toISOString().split("T")[0]}.xlsx"`
  );

  res.send(excelBuffer);
});

export const getCustomersReportExcel = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    throw new ApiError(400, "Query params 'startDate' and 'endDate' are required (format: YYYY-MM-DD)");
  }

  const { start, end } = parseDateRange(startDate as string, endDate as string);

  if (!req.user) {
    throw new ApiError(401, "Unauthorized");
  }

  const excelBuffer = await reportService.generateCustomersReportExcel(req.user.id, req.user.role, start, end);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="Laporan_Customers_${start!.toISOString().split("T")[0]}_sd_${end!.toISOString().split("T")[0]}.xlsx"`
  );

  res.send(excelBuffer);
});