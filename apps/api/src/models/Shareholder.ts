import { Schema, model, type Document, type Types } from "mongoose";

export type ShareholderStatus = "active" | "inactive";

export interface IShareholder extends Document {
  _id: Types.ObjectId;
  fullName: string;
  email?: string;
  phone?: string;
  sharePercent: number;
  investmentCents: number;
  status: ShareholderStatus;
  notes?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const shareholderSchema = new Schema<IShareholder>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    sharePercent: { type: Number, required: true, min: 0, max: 100 },
    investmentCents: { type: Number, required: true, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export const Shareholder = model<IShareholder>("Shareholder", shareholderSchema);
