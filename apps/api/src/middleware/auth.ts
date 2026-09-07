import type { NextFunction, Request, Response } from "express";
import type { Permission } from "@qalinraac/shared";
import { AppError } from "../lib/app-error.js";
import { verifyAccessToken, type AccessTokenPayload } from "../lib/tokens.js";
import { User } from "../models/User.js";

export interface AuthUser extends AccessTokenPayload {
  id: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new AppError(401, "UNAUTHORIZED", "Missing or invalid authorization header");
    }
    const token = header.slice(7);
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).lean();
    if (!user || !user.isActive) {
      throw new AppError(401, "UNAUTHORIZED", "User not found or inactive");
    }
    req.user = {
      id: String(user._id),
      sub: String(user._id),
      email: user.email,
      role: user.role,
      permissions: user.permissions as Permission[],
    };
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    return next(new AppError(401, "UNAUTHORIZED", "Invalid or expired token"));
  }
}

export function requirePermission(...perms: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, "UNAUTHORIZED", "Authentication required"));
    }
    const hasAll = perms.every((p) => req.user!.permissions.includes(p));
    if (!hasAll) {
      return next(new AppError(403, "FORBIDDEN", "Insufficient permissions"));
    }
    next();
  };
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next();
  }
  return authenticate(req, _res, next);
}
