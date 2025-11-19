import { Router } from "express";
import * as controller from "../controllers/leadController";
import { requireAuth } from "../middleware/authMiddleware";
import { roleMiddleware } from "../middleware/role";
import { validate } from "../middleware/validate";
import {
  createLeadSchema,
  updateLeadSchema,
  idParamSchema,
} from "../schema/lead.schema";

const router = Router();

router.use(requireAuth);

// ==============================
// Dibolehkan untuk SALES & MANAGER
// ==============================

router.post("/", validate(createLeadSchema), controller.createLead);
router.get("/", controller.getAllLeads);
router.get("/:id",  controller.getLeadById);
router.patch("/:id", validate(updateLeadSchema), controller.updateLead);

router.delete("/:id", validate(idParamSchema), controller.deleteLead);

// ==============================
// Hanya MANAGER
// ==============================

router.post(
  "/:id/convert",
  roleMiddleware("MANAGER"),
  validate(idParamSchema),
  controller.convertLead
);

export default router;