import { Schema, model, type Document, type Types } from "mongoose";

export interface IFileAsset extends Document {
  _id: Types.ObjectId;
  originalName: string;
  mimeType: string;
  size: number;
  storage: "local" | "r2";
  path: string;
  url?: string;
  uploadedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const fileAssetSchema = new Schema<IFileAsset>(
  {
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    storage: { type: String, enum: ["local", "r2"], default: "local" },
    path: { type: String, required: true },
    url: { type: String },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export const FileAsset = model<IFileAsset>("FileAsset", fileAssetSchema);
