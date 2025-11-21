import { Router } from "express";
import * as controller from "../controllers/dashboardController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

router.use(requireAuth);
router.get("/stats", controller.getDashboardStats);

export default router;

