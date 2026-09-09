import { Schema, model, type Document, type Types } from "mongoose";

export type WithdrawalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "completed";

export type WithdrawalPaymentMethod =
  | "waafi"
  | "evc_plus"
  | "zaad"
  | "bank_transfer";

export interface IWithdrawal extends Document {
  _id: Types.ObjectId;
  instructorId: Types.ObjectId;
  amountCents: number;
  currency: string;
  paymentMethod: WithdrawalPaymentMethod;
  status: WithdrawalStatus;
  note?: string;
  rejectionReason?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const withdrawalSchema = new Schema<IWithdrawal>(
  {
    instructorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amountCents: { type: Number, required: true, min: 1 },
    currency: { type: String, default: "USD" },
    paymentMethod: {
      type: String,
      enum: ["waafi", "evc_plus", "zaad", "bank_transfer"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
    },
    note: { type: String, trim: true },
    rejectionReason: { type: String },
    processedAt: { type: Date },
  },
  { timestamps: true },
);

export const Withdrawal = model<IWithdrawal>("Withdrawal", withdrawalSchema);
