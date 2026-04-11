"use server";

import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { isValidPhoneNumber, normalizePhoneNumber } from "@/lib/phone";
import Otp from "@/models/Otp";
import User from "@/models/User";

/** Register a new user after OTP verification */
export async function registerUser(formData) {
  try {
    const name = formData.get?.("name") ?? formData.name;
    const email = formData.get?.("email") ?? formData.email;
    const phone = formData.get?.("phone") ?? formData.phone;
    const password = formData.get?.("password") ?? formData.password;

    if (!name || !email || !phone || !password) {
      return { error: "Please fill in all fields." };
    }

    if (!isValidPhoneNumber(phone)) {
      return { error: "Please enter a valid mobile number." };
    }

    if (password.length < 8) {
      return { error: "Password must be at least 8 characters." };
    }

    const emailLower = email.toLowerCase().trim();
    const phoneDisplay = phone.trim();
    const phoneNormalized = normalizePhoneNumber(phoneDisplay);

    await dbConnect();

    const otp = await Otp.findOne({
      email: emailLower,
      purpose: "signup",
      verified: true,
    });

    if (!otp) {
      return { error: "Email not verified. Please complete OTP verification first." };
    }

    const existing = await User.findOne({ email: emailLower });
    if (existing?.password) {
      return { error: "An account with this email already exists." };
    }

    const phoneOwner = await User.findOne({ phoneNormalized });
    if (phoneOwner && phoneOwner.email !== emailLower) {
      return { error: "This mobile number is already linked to another account." };
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    if (existing) {
      await User.findByIdAndUpdate(existing._id, {
        name: name.trim(),
        phone: phoneDisplay,
        phoneNormalized,
        password: hashed,
      });
    } else {
      await User.create({
        name: name.trim(),
        email: emailLower,
        phone: phoneDisplay,
        phoneNormalized,
        password: hashed,
        role: "user",
      });
    }

    await Otp.deleteMany({ email: emailLower, purpose: "signup" });

    return { success: true };
  } catch (err) {
    console.error("Registration error:", err);
    return { error: "Something went wrong. Please try again." };
  }
}

/** Reset password after OTP verification */
export async function resetPassword({ email, password }) {
  try {
    if (!email || !password) {
      return { error: "Missing fields." };
    }

    if (password.length < 8) {
      return { error: "Password must be at least 8 characters." };
    }

    const emailLower = email.toLowerCase().trim();

    await dbConnect();

    const otp = await Otp.findOne({
      email: emailLower,
      purpose: "reset_password",
      verified: true,
    });

    if (!otp) {
      return { error: "OTP not verified. Please restart the password reset process." };
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    await User.findOneAndUpdate({ email: emailLower }, { password: hashed });
    await Otp.deleteMany({ email: emailLower, purpose: "reset_password" });

    return { success: true };
  } catch (err) {
    console.error("Reset password error:", err);
    return { error: "Something went wrong. Please try again." };
  }
}

/** Change password for a logged-in user */
export async function changePassword({ currentPassword, newPassword }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { error: "Not authenticated." };
    }

    if (!currentPassword || !newPassword) {
      return { error: "Missing fields." };
    }

    if (newPassword.length < 8) {
      return { error: "New password must be at least 8 characters." };
    }

    await dbConnect();
    const user = await User.findById(session.user.id);

    if (!user) {
      return { error: "User not found." };
    }

    if (!user.password) {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(newPassword, salt);
      await User.findByIdAndUpdate(user._id, { password: hashed });
      return { success: true };
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return { error: "Current password is incorrect." };
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);
    await User.findByIdAndUpdate(user._id, { password: hashed });

    return { success: true };
  } catch (err) {
    console.error("Change password error:", err);
    return { error: "Something went wrong. Please try again." };
  }
}
