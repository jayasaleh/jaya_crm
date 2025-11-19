import { Request, Response } from "express";
import * as userService from "../services/userService";
import { asyncHandler } from "../middleware/asyncHandler";

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await userService.getAllUsers();
  res.json({ code: 200, status: "success", message: "Users retrieved successfully", data: users });
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const user = await userService.getUserById(id);
  if (!user) throw { status: 404, message: "User not found" };
  res.json({ code: 200, status: "success", message: "User retrieved successfully", data: user });
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  res.status(201).json({ code: 201, status: "success", message: "User created successfully", data: user });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const user = await userService.updateUser(id, req.body);
  res.json({ code: 200, status: "success", message: "User updated successfully", data: user });
});

export const toggleActiveStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { isActive } = req.body;
    const user = await userService.toggleActiveStatus(id, isActive);
    res.json({ code: 200, status: "success", message: "User status updated successfully" });
  }
);

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const user = await userService.deleteUser(id);
  res.json({ code: 200,status:"success", message: "User deleted successfully"});
});
