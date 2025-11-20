import { Router } from "express";
import * as controller from "../controllers/customerController";
import { requireAuth } from "../middleware/authMiddleware";


const router = Router();

router.use(requireAuth);

// Semua user terautentikasi bisa akses
router.get("/", controller.getAllActiveCustomers);
router.get("/:id", controller.getActiveCustomerById);

export default router;