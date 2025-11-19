import { logger } from "../config/logger";
import prisma from "../config/prisma";
import bcrypt from "bcryptjs";


const SALT_ROUNDS = 10;

export async function getAllUsers() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      where:{
       NOT:{
        role:"MANAGER"
       }
      }
    });
    logger.info(`Fetched all users: ${users.length} records`);
    return users;
  } catch (err: any) {
    logger.error(`getAllUsers error: ${err.message}`);
    throw err;
  }
}

export async function getUserById(id: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    if (!user) {
      logger.warn(`getUserById: User with id ${id} not found`);
      return null;
    }
    logger.info(`Fetched user: ${id}`);
    return user;
  } catch (err: any) {
    logger.error(`getUserById error: ${err.message}`);
    throw err;
  }
}

export async function createUser(data: any) {
  try {
    const hashed = await bcrypt.hash(data.password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        role: data.role || "SALES",
      },
    });
    logger.info(`Created user: ${user.id} (${user.email})`);
    return user;
  } catch (err: any) {
    logger.error(`createUser error: ${err.message}`);
    throw err;
  }
}

export async function updateUser(id: number, data: any) {
  try {
    const user = await prisma.user.update({
      where: { id },
      data,
    });
    logger.info(`Updated user: ${id}`);
    return user;
  } catch (err: any) {
    logger.error(`updateUser error: ${err.message}`);
    throw err;
  }
}

export async function toggleActiveStatus(id: number, status: boolean) {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: status },
    });
    logger.info(`Set active status for user ${id} to ${status}`);
    return user;
  } catch (err: any) {
    logger.error(`toggleActiveStatus error: ${err.message}`);
    throw err;
  }
}

export async function deleteUser(id: number) {
  try {
    const user = await prisma.user.delete({
      where: { id },
    });
    logger.info(`Deleted user: ${id}`);
    return user;
  } catch (err: any) {
    logger.error(`deleteUser error: ${err.message}`);
    throw err;
  }
}
