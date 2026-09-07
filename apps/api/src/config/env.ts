import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().default("/api/v1"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/qalinraac_academy"),
  REDIS_URL: z.string().default("redis://127.0.0.1:6379"),
  JWT_ACCESS_SECRET: z.string().min(16).default("dev-access-secret-change-me"),
  JWT_REFRESH_SECRET: z.string().min(16).default("dev-refresh-secret-change-me"),
  JWT_ACCESS_EXPIRES: z.string().default("15m"),
  JWT_REFRESH_EXPIRES: z.string().default("7d"),
  SEED_ON_BOOT: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  UPLOAD_DIR: z.string().default("uploads"),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  WAAFI_API_URL: z.string().default("https://api.waafipay.net/asm"),
  WAAFI_MERCHANT_UID: z.string().optional(),
  WAAFI_API_USER_ID: z.string().optional(),
  WAAFI_API_KEY: z.string().optional(),
  SES_REGION: z.string().default("us-east-1"),
  SES_ACCESS_KEY_ID: z.string().optional(),
  SES_SECRET_ACCESS_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("noreply@qalinraac.local"),
  EMAIL_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

export const env = envSchema.parse(process.env);

export function hasR2Config(): boolean {
  return Boolean(
    env.R2_ACCOUNT_ID &&
      env.R2_ACCESS_KEY_ID &&
      env.R2_SECRET_ACCESS_KEY &&
      env.R2_BUCKET,
  );
}

export function hasSesConfig(): boolean {
  return Boolean(env.EMAIL_ENABLED && env.SES_ACCESS_KEY_ID && env.SES_SECRET_ACCESS_KEY);
}

export function hasStripeConfig(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY);
}

export function hasWaafiConfig(): boolean {
  return Boolean(env.WAAFI_API_KEY && env.WAAFI_MERCHANT_UID && env.WAAFI_API_USER_ID);
}
