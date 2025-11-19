import { Request, Response, NextFunction } from "express";
import ApiResponse from "../utils/apiResponse";
import ApiError from "../utils/apiError";


export default function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("❌ Error:", err);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json(
      new ApiResponse(err.message, err.errors, false)
    );
  }

  // Unexpected error
  return res.status(500).json(
    new ApiResponse("Internal server error", err, false)
  );
}