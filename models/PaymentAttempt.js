/**
 * Rate limiting for payment lock abuse.
 * Tracks failed/abandoned payment lock attempts per user/IP.
 * After 5 consecutive lock-without-pay events in a window, user is flagged for ban.
 */
import mongoose from "mongoose";

const PaymentAttemptSchema = new mongoose.Schema({
  identifier: { type: String, required: true }, // userId or IP
  type:       { type: String, enum: ["user", "ip"], required: true },
  count:      { type: Number, default: 1 },
  windowStart:{ type: Date, default: Date.now },
  banned:     { type: Boolean, default: false },
  bannedAt:   { type: Date, default: null },
});

PaymentAttemptSchema.index({ identifier: 1, type: 1 }, { unique: true });
// Auto-clean records older than 24h (rolling window)
PaymentAttemptSchema.index({ windowStart: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.models.PaymentAttempt || mongoose.model("PaymentAttempt", PaymentAttemptSchema);
