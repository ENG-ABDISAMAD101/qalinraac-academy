import bcrypt from "bcryptjs";
import { ROLE_PERMISSIONS, type RegisterInput, type LoginInput } from "@qalinraac/shared";
import { AppError } from "../../lib/app-error.js";
import {
  generateRefreshToken,
  hashToken,
  refreshExpiresAt,
  signAccessToken,
} from "../../lib/tokens.js";
import { writeAuditLog } from "../../lib/audit.js";
import { RefreshToken } from "../../models/RefreshToken.js";
import { User } from "../../models/User.js";

function toPublicUser(user: {
  _id: { toString(): string };
  email: string;
  fullName: string;
  role: keyof typeof ROLE_PERMISSIONS;
  permissions: string[];
  isActive: boolean;
  avatarUrl?: string;
  createdAt?: Date;
}) {
  return {
    id: String(user._id),
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    permissions: user.permissions,
    isActive: user.isActive,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}

async function issueTokens(user: InstanceType<typeof User>) {
  const accessToken = signAccessToken({
    sub: String(user._id),
    email: user.email,
    role: user.role,
    permissions: user.permissions,
  });
  const refreshToken = generateRefreshToken();
  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: refreshExpiresAt(),
  });
  return { accessToken, refreshToken, user: toPublicUser(user) };
}

export async function register(input: RegisterInput, ip?: string) {
  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) {
    throw new AppError(409, "EMAIL_EXISTS", "Email already registered");
  }

  // Only allow Student self-registration; elevated roles require admin
  const role = "Student" as const;
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await User.create({
    email: input.email.toLowerCase(),
    passwordHash,
    fullName: input.fullName,
    role,
    permissions: [...ROLE_PERMISSIONS[role]],
  });

  await writeAuditLog({
    actorId: user._id,
    action: "auth.register",
    resource: "User",
    resourceId: String(user._id),
    ip,
  });

  return issueTokens(user);
}

export async function login(input: LoginInput, ip?: string) {
  const user = await User.findOne({ email: input.email.toLowerCase() }).select(
    "+passwordHash",
  );
  if (!user || !user.isActive) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }
  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  // Ensure permissions stay in sync with role
  user.permissions = [...ROLE_PERMISSIONS[user.role]];
  await user.save();

  await writeAuditLog({
    actorId: user._id,
    action: "auth.login",
    resource: "User",
    resourceId: String(user._id),
    ip,
  });

  return issueTokens(user);
}

export async function refresh(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  const stored = await RefreshToken.findOne({ tokenHash, revokedAt: { $exists: false } });
  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError(401, "INVALID_REFRESH", "Invalid or expired refresh token");
  }
  const user = await User.findById(stored.userId);
  if (!user || !user.isActive) {
    throw new AppError(401, "UNAUTHORIZED", "User not found or inactive");
  }
  stored.revokedAt = new Date();
  await stored.save();
  return issueTokens(user);
}

export async function logout(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  await RefreshToken.updateOne({ tokenHash }, { $set: { revokedAt: new Date() } });
  return { loggedOut: true };
}

export async function me(userId: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, "NOT_FOUND", "User not found");
  }
  return toPublicUser(user);
}

export { toPublicUser };
