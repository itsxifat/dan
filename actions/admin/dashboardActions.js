"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { hasPermission } from "@/lib/permissions";

export async function getDashboardStats() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasPermission(session.user.role, "dashboard.read")) {
    throw new Error("Unauthorized");
  }

  await dbConnect();

  const now = new Date();
  const weekAgo  = new Date(now - 7  * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const [totalUsers, newThisWeek, newThisMonth, roleDist, statusDist, recentUsers] =
    await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
      User.countDocuments({ createdAt: { $gte: monthAgo } }),
      User.aggregate([{ $group: { _id: "$role",   count: { $sum: 1 } } }]),
      User.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      User.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .select("name email role image status createdAt lastLogin")
        .lean(),
    ]);

  return {
    totalUsers,
    newThisWeek,
    newThisMonth,
    roleDist:    Object.fromEntries(roleDist.map((r) => [r._id, r.count])),
    statusDist:  Object.fromEntries(statusDist.map((s) => [s._id, s.count])),
    recentUsers: JSON.parse(JSON.stringify(recentUsers)),
  };
}
