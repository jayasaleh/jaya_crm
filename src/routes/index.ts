import { Router } from "express";
import authRoute from "./authRoute";
import userRoute from "./userRoute";
import leadRoute from "./leadRoute";
import productRoute from "./productRoute";
import dealRoute from "./dealRoute";
import customerRoute from "./customerRoute";
import reportRoute from "./reportRoute";

const router = Router();

router.use("/auth", authRoute);
router.use("/users",userRoute)
router.use("/leads", leadRoute);
router.use("/products", productRoute);
router.use("/deals", dealRoute);
router.use("/customers",customerRoute);
router.use("/reports", reportRoute);


export default router;