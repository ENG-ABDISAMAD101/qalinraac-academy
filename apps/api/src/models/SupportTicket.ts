import { Schema, model, type Document, type Types } from "mongoose";

export type SupportTicketStatus =
  | "open"
  | "pending"
  | "replied"
  | "closed";

export interface ISupportTicket extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  subject: string;
  body: string;
  status: SupportTicketStatus;
  attachmentIds: Types.ObjectId[];
  replies: {
    authorId: Types.ObjectId;
    body: string;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subject: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "pending", "replied", "closed"],
      default: "open",
    },
    attachmentIds: [{ type: Schema.Types.ObjectId, ref: "FileAsset" }],
    replies: [
      {
        authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        body: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

export const SupportTicket = model<ISupportTicket>(
  "SupportTicket",
  supportTicketSchema,
);
