import { Schema, model, type Document, type Types } from "mongoose";

export interface IExpense extends Document {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  amountCents: number;
  currency: string;
  category?: string;
  expenseDate: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    amountCents: { type: Number, required: true, min: 1 },
    currency: { type: String, default: "USD" },
    category: { type: String, trim: true },
    expenseDate: { type: Date, required: true, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export const Expense = model<IExpense>("Expense", expenseSchema);
