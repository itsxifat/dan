import mongoose from "mongoose";

export const ROLES = ["owner", "admin", "moderator", "viewer", "user"];
export const ADMIN_ROLES = ["owner", "admin", "moderator", "viewer"];

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a name"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Please provide an email"],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: false,
  },
  image: {
    type: String,
  },
  role: {
    type: String,
    enum: ROLES,
    default: "user",
  },
  status: {
    type: String,
    enum: ["active", "suspended", "banned"],
    default: "active",
  },
  phone: {
    type: String,
    default: "",
  },
  address: {
    type: String,
    default: "",
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
