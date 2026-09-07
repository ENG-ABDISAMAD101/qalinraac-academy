import {
  AcademyRole,
  ROLE_PERMISSIONS,
  type AcademyRole as AcademyRoleType,
  type Permission,
} from "@qalinraac/shared";
import { Schema, model, type Document, type Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  fullName: string;
  role: AcademyRoleType;
  permissions: Permission[];
  isActive: boolean;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    fullName: { type: String, required: true, trim: true },
    role: { type: String, enum: AcademyRole.options, required: true, default: "Student" },
    permissions: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    avatarUrl: { type: String },
  },
  { timestamps: true },
);

userSchema.pre("save", function () {
  if (this.isModified("role") || this.isNew) {
    this.permissions = [...ROLE_PERMISSIONS[this.role]];
  }
});

export const User = model<IUser>("User", userSchema);
