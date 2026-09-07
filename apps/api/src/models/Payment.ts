import { paymentProviderSchema } from "@qalinraac/shared";
import { Schema, model, type Document, type Types } from "mongoose";

export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";
export type PaymentProvider = "stripe" | "waafi" | "manual";

export interface IPayment extends Document {
  _id: Types.ObjectId;
  invoiceId: Types.ObjectId;
  userId: Types.ObjectId;
  provider: PaymentProvider;
  amountCents: number;
  currency: string;
  status: PaymentStatus;
  providerRef?: string;
  rawResponse?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    provider: {
      type: String,
      enum: paymentProviderSchema.options,
      required: true,
    },
    amountCents: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed", "refunded"],
      default: "pending",
    },
    providerRef: { type: String },
    rawResponse: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

export const Payment = model<IPayment>("Payment", paymentSchema);
