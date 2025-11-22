// src/routes/reportRoute.ts
import { Router } from "express";
import * as controller from "../controllers/reportController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

// Semua endpoint reporting memerlukan autentikasi
router.use(requireAuth);

// JSON report (untuk API / frontend)
router.get("/sales", controller.getSalesReport);
router.get("/leads", controller.getLeadsReport);
router.get("/customers", controller.getCustomersReport);

// Excel report (untuk download)
router.get("/sales.xlsx", controller.getSalesReportExcel);
router.get("/leads.xlsx", controller.getLeadsReportExcel);
router.get("/customers.xlsx", controller.getCustomersReportExcel);

export default router;