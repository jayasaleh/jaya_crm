import { Router } from "express";
import * as controller from "../controllers/dealController";
import { validate } from "../middleware/validate";
import { approvalActionSchema, createDealSchema, idParamSchema } from "../schema/deal.schema";
import { requireAuth } from "../middleware/authMiddleware";
import { roleMiddleware } from "../middleware/role";

const router = Router();


router.use(requireAuth);
router.post("/", validate(createDealSchema), controller.createDeal);
router.get("/", controller.getAllDeals);
router.get("/:id", controller.getDealById);
router.patch("/:id/submit", validate(idParamSchema), controller.submitDeal);
router.post("/:id/activate", validate(idParamSchema), controller.activateDeal);

router.use(roleMiddleware("MANAGER"));
router.patch("/:id/approve", validate(approvalActionSchema), controller.approveDeal);
router.patch("/:id/reject", validate(approvalActionSchema), controller.rejectDeal);

export default router;