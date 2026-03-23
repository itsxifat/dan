"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function addOrPromoteAdmin({ name, email, password, role }) {
  const session = await getServerSession(authOptions);

  if (!["owner", "admin"].includes(session?.user?.role)) {
    throw new Error("Unauthorized: only owners and admins can manage admin users");
  }

  // Which roles the current actor may assign
  const assignable = session.user.role === "owner"
    ? ["owner", "admin", "moderator", "viewer"]
    : ["admin", "moderator", "viewer"];

  if (!assignable.includes(role)) {
    throw new Error(`You cannot assign the "${role}" role`);
  }

  // Validate inputs
  if (!email?.trim()) throw new Error("Email is required");
  if (!EMAIL_RE.test(email))  throw new Error("Invalid email address");
  if (!role)                  throw new Error("Role is required");

  await dbConnect();

  const existing = await User.findOne({ email: email.toLowerCase().trim() });

  if (existing) {
    // Promote existing user
    if (existing.role === "owner" && session.user.role !== "owner") {
      throw new Error("Cannot modify the owner account");
    }
    if (existing._id.toString() === session.user.id) {
      throw new Error("Cannot modify your own account");
    }

    await User.findByIdAndUpdate(existing._id, {
      role,
      createdBy: session.user.id,
    });

    revalidatePath("/admin/users");
    return {
      success: true,
      action:  "promoted",
      message: `${existing.name}'s role has been updated to ${role}`,
    };
  }

  // Create new user
  if (!name?.trim()) throw new Error("Name is required when creating a new user");

  let hashedPassword = null;
  if (password) {
    if (password.length < 8) throw new Error("Password must be at least 8 characters");
    hashedPassword = await bcrypt.hash(password, 12);
  }

  await User.create({
    name:      name.trim(),
    email:     email.toLowerCase().trim(),
    password:  hashedPassword,
    role,
    status:    "active",
    createdBy: session.user.id,
  });

  revalidatePath("/admin/users");
  return {
    success: true,
    action:  "created",
    message: `Admin user "${name.trim()}" created with role ${role}`,
  };
}
