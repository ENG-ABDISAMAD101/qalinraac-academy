import { Schema, model, type Document, type Types } from "mongoose";

export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  body: string;
  type: string;
  readAt?: Date;
  meta?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: { type: String, default: "info" },
    readAt: { type: Date },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

export const Notification = model<INotification>("Notification", notificationSchema);
