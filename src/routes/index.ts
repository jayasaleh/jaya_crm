import { Router } from "express";
import authRoute from "./authRoute";
import userRoute from "./userRoute";
import leadRoute from "./leadRoute";

const router = Router();

router.use("/auth", authRoute);
router.use("/users",userRoute)
router.use("/leads", leadRoute);

export default router;