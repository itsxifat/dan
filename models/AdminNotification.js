import mongoose from "mongoose";

const AdminNotificationSchema = new mongoose.Schema(
  {
    type: {
      type:    String,
      enum:    ["booking", "review", "corporate", "payment", "system"],
      default: "system",
    },
    title:    { type: String, required: true, maxlength: 200 },
    message:  { type: String, default: "",    maxlength: 1000 },
    link:     { type: String, default: "",    maxlength: 500 },
    isRead:   { type: Boolean, default: false },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true, // createdAt + updatedAt auto-managed
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Admin bell: fetch unread count + latest notifications
// Query: { isRead: false } ORDER BY createdAt DESC
AdminNotificationSchema.index({ isRead: 1, createdAt: -1 });

// Type-filtered view ("show me all booking notifications")
AdminNotificationSchema.index({ type: 1, createdAt: -1 });

// Full newest-first list (default admin feed)
AdminNotificationSchema.index({ createdAt: -1 });

// TTL: auto-delete notifications older than 90 days to keep the collection lean.
// MongoDB TTL monitor runs every 60 s, so actual deletion may lag slightly.
AdminNotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60, name: "ttl_90d" }
);

// ─── Model ────────────────────────────────────────────────────────────────────
export default mongoose.models.AdminNotification ||
  mongoose.model("AdminNotification", AdminNotificationSchema);
