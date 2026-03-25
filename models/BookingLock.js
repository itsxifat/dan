/**
 * Temporary 1-minute room lock during payment.
 * MongoDB TTL index auto-removes documents after `expiresAt`.
 */
import mongoose from "mongoose";

const BookingLockSchema = new mongoose.Schema({
  roomId:    { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  date:      { type: String, required: true },   // "YYYY-MM-DD" for day_long; "YYYY-MM-DD" checkIn for night_stay
  checkIn:   { type: Date, required: true },
  checkOut:  { type: Date, required: true },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  sessionId: { type: String, default: "" },      // for anonymous locks
  lockedAt:  { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },      // TTL field — set to lockedAt + 60s
});

// TTL index — MongoDB auto-deletes doc when expiresAt is reached
BookingLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
BookingLockSchema.index({ roomId: 1, checkIn: 1, checkOut: 1 });

if (process.env.NODE_ENV !== "production" && mongoose.models.BookingLock) {
  delete mongoose.models.BookingLock;
}

export default mongoose.models.BookingLock || mongoose.model("BookingLock", BookingLockSchema);
