import crypto from "crypto";
import { NextResponse } from "next/server";
import { sendOtpEmail } from "@/lib/email";
import dbConnect from "@/lib/db";
import { isValidPhoneNumber, normalizePhoneNumber } from "@/lib/phone";
import Otp from "@/models/Otp";
import User from "@/models/User";

const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 3;

export async function POST(req) {
  try {
    const { email, phone, purpose } = await req.json();

    if (!email || !["signup", "reset_password"].includes(purpose)) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();
    const phoneDisplay = (phone || "").trim();
    const phoneNormalized = phoneDisplay ? normalizePhoneNumber(phoneDisplay) : "";

    if (purpose === "signup") {
      if (!phoneDisplay || !isValidPhoneNumber(phoneDisplay)) {
        return NextResponse.json({ error: "Please enter a valid mobile number." }, { status: 400 });
      }
    }

    await dbConnect();

    if (purpose === "signup") {
      const existing = await User.findOne({ email: emailLower });
      if (existing?.password) {
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
      }

      const phoneOwner = await User.findOne({ phoneNormalized });
      if (phoneOwner && phoneOwner.email !== emailLower) {
        return NextResponse.json(
          { error: "This mobile number is already linked to another account." },
          { status: 409 }
        );
      }
    }

    if (purpose === "reset_password") {
      const existing = await User.findOne({ email: emailLower });
      if (!existing) {
        return NextResponse.json({ success: true });
      }
    }

    const windowStart = new Date(Date.now() - RATE_WINDOW_MS);
    const recentCount = await Otp.countDocuments({
      email: emailLower,
      purpose,
      createdAt: { $gte: windowStart },
    });

    if (recentCount >= MAX_REQUESTS) {
      return NextResponse.json({ error: "Too many requests. Please wait a few minutes." }, { status: 429 });
    }

    await Otp.deleteMany({ email: emailLower, purpose, verified: false });

    const code = String(crypto.randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await Otp.create({ email: emailLower, code, purpose, expiresAt });
    await sendOtpEmail(emailLower, code, purpose);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("OTP send error:", err);
    return NextResponse.json({ error: "Failed to send OTP. Please try again." }, { status: 500 });
  }
}
