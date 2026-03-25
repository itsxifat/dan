import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Otp from "@/models/Otp";
import User from "@/models/User";
import { sendOtpEmail } from "@/lib/email";
import crypto from "crypto";

// Rate limit: max 3 OTP requests per email per 10 minutes
const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS   = 3;

export async function POST(req) {
  try {
    const { email, purpose } = await req.json();

    if (!email || !["signup", "reset_password"].includes(purpose)) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();

    await dbConnect();

    // For signup: reject if email already fully registered (has password or is not Google-only)
    if (purpose === "signup") {
      const existing = await User.findOne({ email: emailLower });
      if (existing?.password) {
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
      }
    }

    // For reset: email must exist
    if (purpose === "reset_password") {
      const existing = await User.findOne({ email: emailLower });
      if (!existing) {
        // Return success anyway to prevent email enumeration
        return NextResponse.json({ success: true });
      }
    }

    // Rate limiting
    const windowStart = new Date(Date.now() - RATE_WINDOW_MS);
    const recentCount = await Otp.countDocuments({
      email: emailLower,
      purpose,
      createdAt: { $gte: windowStart },
    });
    if (recentCount >= MAX_REQUESTS) {
      return NextResponse.json({ error: "Too many requests. Please wait a few minutes." }, { status: 429 });
    }

    // Delete any existing unused OTPs for this email+purpose
    await Otp.deleteMany({ email: emailLower, purpose, verified: false });

    // Generate 6-digit OTP
    const code = String(crypto.randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await Otp.create({ email: emailLower, code, purpose, expiresAt });

    // Send email
    await sendOtpEmail(emailLower, code, purpose);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("OTP send error:", err);
    return NextResponse.json({ error: "Failed to send OTP. Please try again." }, { status: 500 });
  }
}
