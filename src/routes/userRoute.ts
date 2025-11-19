import { Router } from "express";
import * as userController from "../controllers/userController";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/authMiddleware";
import { roleMiddleware } from "../middleware/role";


const userRoute = Router();

userRoute.use(requireAuth);           
userRoute.use(roleMiddleware("MANAGER"));  

// GET all users
userRoute.get("/", asyncHandler(userController.getAllUsers));

// GET user by ID
userRoute.get("/:id", asyncHandler(userController.getUserById));

// CREATE new user (manager create sales)
userRoute.post("/", asyncHandler(userController.createUser));

// UPDATE user info
userRoute.patch("/:id", asyncHandler(userController.updateUser));

// ACTIVATE / DEACTIVATE user
userRoute.patch("/:id/activate", asyncHandler(userController.toggleActiveStatus));

// DELETE user
userRoute.delete("/:id", asyncHandler(userController.deleteUser));

export default userRoute;
