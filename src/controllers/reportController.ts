
import { Request, Response } from "express";
import * as reportService from "../services/reportService";
import { asyncHandler } from "../middleware/asyncHandler";
import ApiResponse from "../utils/apiResponse";
import ApiError from "../utils/apiError";


export const getSalesReport = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  let start: Date | undefined;
  let end: Date | undefined;

  // If dates provided, validate them
  if (startDate || endDate) {
    if (!startDate || !endDate) {
      throw new ApiError(400, "Both 'startDate' and 'endDate' are required when filtering (format: YYYY-MM-DD)");
    }

    start = new Date(startDate as string);
    end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ApiError(400, "Invalid date format. Use YYYY-MM-DD");
    }

    if (start > end) {
      throw new ApiError(400, "startDate cannot be after endDate");
    }
  }

  const report = await reportService.getSalesReport(start, end);
  res.json(new ApiResponse("Sales report generated successfully", report));
});

export const getSalesReportExcel = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    throw new ApiError(400, "Query params 'startDate' and 'endDate' are required (format: YYYY-MM-DD)");
  }

  const start = new Date(startDate as string);
  const end = new Date(endDate as string);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new ApiError(400, "Invalid date format. Use YYYY-MM-DD");
  }

  if (start > end) {
    throw new ApiError(400, "startDate cannot be after endDate");
  }

  const excelBuffer = await reportService.generateSalesReportExcel(start, end);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="Laporan_Penjualan_${start.toISOString().split("T")[0]}_sd_${end.toISOString().split("T")[0]}.xlsx"`
  );

  res.send(excelBuffer);
});