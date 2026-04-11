import mongoose from "mongoose";

/**
 * Notification — in-app notifications for guests and admins.
 *
 * targetType:
 *   "all"  → sent to every user (readBy tracks who has dismissed it)
 *   "user" → sent to a specific user (isRead tracks read state)
 */
const NotificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["booking_update", "payment", "alert", "coupon", "message", "system"],
    default: "message",
  },

  // Who receives this notification
  targetType: {
    type: String,
    enum: ["all", "user"],
    required: true,
    default: "all",
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  // Content
  header: { type: String, required: true, trim: true },
  body:   { type: String, required: true, trim: true },
  image:  { type: String, default: "" },  // optional image URL

  // For "all" notifications: array of userIds who have read/dismissed it
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // For "user" (personal) notifications: simple flag
  isRead: { type: Boolean, default: false },

  // Extra contextual data (e.g. { bookingId: "..." } for booking updates)
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },

  // Linked discount/coupon (optional — for coupon-type notifications)
  linkedDiscount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Discount",
    default: null,
  },

  isActive: { type: Boolean, default: true },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  createdAt: { type: Date, default: Date.now },
});

NotificationSchema.index({ targetType: 1, createdAt: -1 });
NotificationSchema.index({ targetUser: 1, isRead: 1 });
NotificationSchema.index({ isActive: 1, createdAt: -1 });

export default mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);
