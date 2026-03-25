/**
 * OTP verification model.
 * Used for email signup verification and forgot-password reset.
 * TTL index auto-removes expired OTPs.
 */
import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema({
  email:     { type: String, required: true, lowercase: true, trim: true },
  code:      { type: String, required: true },
  purpose:   { type: String, enum: ["signup", "reset_password"], required: true },
  attempts:  { type: Number, default: 0 },
  verified:  { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },  // createdAt + 10 minutes
});

// TTL index — auto-delete after expiresAt
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
OtpSchema.index({ email: 1, purpose: 1 });

if (process.env.NODE_ENV !== "production" && mongoose.models.Otp) {
  delete mongoose.models.Otp;
}

export default mongoose.models.Otp || mongoose.model("Otp", OtpSchema);
