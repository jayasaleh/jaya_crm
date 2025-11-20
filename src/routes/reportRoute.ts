// src/routes/reportRoute.ts
import { Router } from "express";
import * as controller from "../controllers/reportController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

// Semua endpoint reporting memerlukan autentikasi
router.use(requireAuth);

// JSON report (untuk API / frontend)
router.get("/sales", controller.getSalesReport);

// Excel report (untuk download)
router.get("/sales.xlsx", controller.getSalesReportExcel);

export default router;