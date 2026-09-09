import { Schema, model, type Document, type Types } from "mongoose";

export interface IManualIncome extends Document {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  amountCents: number;
  currency: string;
  paymentMethod: string;
  incomeDate: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const manualIncomeSchema = new Schema<IManualIncome>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    amountCents: { type: Number, required: true, min: 1 },
    currency: { type: String, default: "USD" },
    paymentMethod: { type: String, required: true, trim: true },
    incomeDate: { type: Date, required: true, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export const ManualIncome = model<IManualIncome>(
  "ManualIncome",
  manualIncomeSchema,
);
