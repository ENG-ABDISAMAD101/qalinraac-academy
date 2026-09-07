import { invoiceStatusSchema } from "@qalinraac/shared";
import { Schema, model, type Document, type Types } from "mongoose";

export type InvoiceStatus = "draft" | "open" | "paid" | "void" | "failed";

export interface IInvoice extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  courseId?: Types.ObjectId;
  enrollmentId?: Types.ObjectId;
  amountCents: number;
  currency: string;
  status: InvoiceStatus;
  description?: string;
  dueAt?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course" },
    enrollmentId: { type: Schema.Types.ObjectId, ref: "Enrollment" },
    amountCents: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD" },
    status: {
      type: String,
      enum: invoiceStatusSchema.options,
      default: "open",
    },
    description: { type: String },
    dueAt: { type: Date },
    paidAt: { type: Date },
  },
  { timestamps: true },
);

export const Invoice = model<IInvoice>("Invoice", invoiceSchema);
