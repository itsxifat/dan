"use server";

import crypto from "crypto";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function claimOwner({ email, token }) {
  // 1. Constant-time token comparison (prevents timing attacks)
  const expected = process.env.OWNER_SETUP_TOKEN;
  if (!expected) throw new Error("Setup is not configured on this server.");

  const a = Buffer.from(token  ?? "");
  const b = Buffer.from(expected);
  const safe = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!safe) throw new Error("Invalid setup token.");

  await dbConnect();

  // 2. If any owner already exists — lock forever
  const ownerExists = await User.exists({ role: "owner" });
  if (ownerExists) throw new Error("An owner already exists. Setup is locked.");

  if (!email?.trim()) throw new Error("Email is required.");

  // 3. Find user and promote — or create if first Google sign-in hasn't happened yet
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    throw new Error(
      "No account found for that email. Sign in once (Google or register) then return here."
    );
  }

  await User.findByIdAndUpdate(user._id, { role: "owner", status: "active" });

  return { success: true, name: user.name };
}
