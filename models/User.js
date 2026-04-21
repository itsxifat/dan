import mongoose from "mongoose";

export const ROLES = ["owner", "admin", "moderator", "viewer", "user"];

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    maxlength: [120, "Name must be 120 characters or fewer"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: [254, "Email must be 254 characters or fewer"],
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"],
  },
  password: {
    type: String,
    // bcrypt hash is always 60 chars; cap slightly higher to be safe
    maxlength: [72, "Password hash too long"],
    select: false, // never returned by default — must be explicitly requested
  },
  image: {
    type: String,
    maxlength: [2048, "Image URL too long"],
  },
  role: {
    type: String,
    enum:    { values: ROLES, message: "Invalid role: {VALUE}" },
    default: "user",
    index:   true,
  },
  status: {
    type: String,
    enum:    { values: ["active", "suspended", "banned"], message: "Invalid status: {VALUE}" },
    default: "active",
    index:   true,
  },
  phone: {
    type: String,
    default: "",
    trim: true,
    maxlength: [30, "Phone must be 30 characters or fewer"],
  },
  phoneNormalized: {
    type:      String,
    default:   "",
    trim:      true,
    maxlength: [20, "Normalised phone too long"],
  },
  address: {
    type:      String,
    default:   "",
    maxlength: [500, "Address must be 500 characters or fewer"],
  },
  lastLogin: { type: Date, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  createdAt: { type: Date, default: Date.now, immutable: true },
});

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Email is covered by the unique constraint (MongoDB auto-creates a unique index).

// Admin user-list queries: filter by status and/or role → sort by createdAt
UserSchema.index({ status: 1, role: 1 });

// Phone lookup for login
UserSchema.index({ phoneNormalized: 1 });

// Chronological listing for admin dashboard (most recent first)
UserSchema.index({ createdAt: -1 });

// ─── Model ────────────────────────────────────────────────────────────────────
const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;
