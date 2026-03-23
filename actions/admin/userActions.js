"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User, { ROLES } from "@/models/User";
import { hasPermission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

async function requirePermission(permission) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasPermission(session.user.role, permission)) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function getUsers({
  page   = 1,
  limit  = 15,
  search = "",
  role   = "",
  status = "",
} = {}) {
  const session = await requirePermission("users.read");

  await dbConnect();

  const query = {};
  if (search) {
    query.$or = [
      { name:  { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }
  if (role)   query.role   = role;
  if (status) query.status = status;

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-password")
      .lean(),
    User.countDocuments(query),
  ]);

  return {
    users: JSON.parse(JSON.stringify(users)),
    total,
    pages: Math.ceil(total / limit) || 1,
    page,
  };
}

export async function updateUserRole(userId, newRole) {
  const session = await requirePermission("users.write");

  if (!ROLES.includes(newRole)) throw new Error("Invalid role");

  await dbConnect();
  const target = await User.findById(userId);
  if (!target) throw new Error("User not found");

  if (target.role === "owner" && session.user.role !== "owner") {
    throw new Error("Only owners can modify the owner account");
  }
  if (newRole === "owner" && session.user.role !== "owner") {
    throw new Error("Only owners can assign the owner role");
  }
  if (target._id.toString() === session.user.id) {
    throw new Error("You cannot modify your own role");
  }

  await User.findByIdAndUpdate(userId, { role: newRole });
  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateUserStatus(userId, newStatus) {
  const session = await requirePermission("users.write");

  const STATUSES = ["active", "suspended", "banned"];
  if (!STATUSES.includes(newStatus)) throw new Error("Invalid status");

  await dbConnect();
  const target = await User.findById(userId);
  if (!target) throw new Error("User not found");

  if (target.role === "owner")                           throw new Error("Cannot modify owner status");
  if (target._id.toString() === session.user.id)        throw new Error("Cannot modify your own status");

  await User.findByIdAndUpdate(userId, { status: newStatus });
  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteUser(userId) {
  const session = await requirePermission("users.delete");

  await dbConnect();
  const target = await User.findById(userId);
  if (!target) throw new Error("User not found");

  if (target.role === "owner")                           throw new Error("Cannot delete the owner");
  if (target._id.toString() === session.user.id)        throw new Error("Cannot delete yourself");

  await User.findByIdAndDelete(userId);
  revalidatePath("/admin/users");
  return { success: true };
}
