import { Router } from "express";
import * as controller from "../controllers/authController";
import { validate } from "../middleware/validate";
import { loginSchema, registerSchema } from "../schema/auth.schema";

const authRoute = Router();

authRoute.post("/login", validate(loginSchema), controller.login);
authRoute.post("/refresh", controller.refresh);
// router.get("/me", requireAuth, asyncHandler(controller.me));

export default authRoute;
