import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Otp from "@/models/Otp";

const MAX_ATTEMPTS = 5;

export async function POST(req) {
  try {
    const { email, code, purpose } = await req.json();

    if (!email || !code || !purpose) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();

    await dbConnect();

    const otp = await Otp.findOne({
      email: emailLower,
      purpose,
      verified: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otp) {
      return NextResponse.json({ error: "OTP expired or not found. Please request a new one." }, { status: 400 });
    }

    if (otp.attempts >= MAX_ATTEMPTS) {
      await Otp.findByIdAndDelete(otp._id);
      return NextResponse.json({ error: "Too many incorrect attempts. Please request a new OTP." }, { status: 429 });
    }

    if (otp.code !== code.trim()) {
      await Otp.findByIdAndUpdate(otp._id, { $inc: { attempts: 1 } });
      const remaining = MAX_ATTEMPTS - otp.attempts - 1;
      return NextResponse.json({
        error: `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
      }, { status: 400 });
    }

    // Mark as verified
    await Otp.findByIdAndUpdate(otp._id, { verified: true });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("OTP verify error:", err);
    return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 500 });
  }
}
