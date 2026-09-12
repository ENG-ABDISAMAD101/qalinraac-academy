import { Schema, model, type Document } from "mongoose";

export interface IAcademySettings extends Document {
  key: string;
  academyName: string;
  supportEmail?: string;
  allowSelfRegistration: boolean;
  defaultCurrency: string;
  certificateRequireCompletion: boolean;
  /** Instructor share of paid course revenue (0–100). Default 60. */
  instructorSharePercent: number;
  branding?: {
    primaryColor?: string;
    logoUrl?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const academySettingsSchema = new Schema<IAcademySettings>(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    academyName: { type: String, default: "Qalinraac Academy" },
    supportEmail: { type: String },
    allowSelfRegistration: { type: Boolean, default: true },
    defaultCurrency: { type: String, default: "USD" },
    certificateRequireCompletion: { type: Boolean, default: true },
    instructorSharePercent: { type: Number, default: 60, min: 0, max: 100 },
    branding: {
      primaryColor: { type: String },
      logoUrl: { type: String },
    },
  },
  { timestamps: true },
);

export const AcademySettings = model<IAcademySettings>(
  "AcademySettings",
  academySettingsSchema,
);
