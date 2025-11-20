import bcrypt from "bcryptjs";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import prisma from "../config/prisma";
import { logger } from "../config/logger"; 

const SALT_ROUNDS = 10;



export async function loginUser(email: string, password: string) {
  logger.info(`Login attempt: ${email}`);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    logger.warn(`Login failed: user not found - ${email}`);
    throw new Error("Invalid credentials");
  }

  const matched = await bcrypt.compare(password, user.password);
  if (!matched) {
    logger.warn(`Login failed: invalid password - ${email}`);
    throw new Error("Invalid credentials");
  }

  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id });

  logger.info(`Login successful: ${email}`);

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  };
}

export async function refreshTokens(refreshToken: string) {
  logger.info(`Refresh token attempt`);

  try {
    const payload = verifyRefreshToken(refreshToken) as any;
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      logger.warn(`Refresh failed: user not found - ID ${payload.userId}`);
      throw new Error("User not found");
    }

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const newRefreshToken = signRefreshToken({ userId: user.id });

    logger.info(`Refresh token successful for user: ${user.email}`);

    return { accessToken, refreshToken: newRefreshToken };
  } catch (err: any) {
    logger.error(`Refresh token failed: ${err.message}`);
    throw new Error("Invalid refresh token");
  }
}
