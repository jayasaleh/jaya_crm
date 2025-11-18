import { Router } from "express";
import { validate } from "../middleware/validate";
import { loginSchema, registerSchema } from "../schema/auth.schema";
import * as controller from "../controllers/authController";
import { requireAuth } from "../middleware/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";
const router = Router();

router.post("/register", validate(registerSchema), asyncHandler(controller.register));
router.post("/login", validate(loginSchema), asyncHandler(controller.login));
router.post("/refresh", asyncHandler(controller.refresh));
router.get("/me", requireAuth, asyncHandler(controller.me));

export default router;
