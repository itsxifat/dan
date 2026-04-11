"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import AdminNotification from "@/models/AdminNotification";
import { hasPermission } from "@/lib/permissions";

// ─── Internal: Create Admin Notification (called from other server actions) ───

export async function createAdminNotification({
  type = "system",
  title,
  message = "",
  link = "",
  metadata = {},
}) {
  try {
    await dbConnect();
    await AdminNotification.create({ type, title, message, link, metadata });
  } catch (err) {
    // Non-blocking — never throw so caller isn't affected
    console.error("[AdminNotif] create error:", err);
  }
}

// ─── Admin: Get Notification Feed ─────────────────────────────────────────────

export async function getAdminNotificationFeed({ page = 1, limit = 30 } = {}) {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "bookings.read")) throw new Error("Unauthorized");

  await dbConnect();
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    AdminNotification.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AdminNotification.countDocuments(),
    AdminNotification.countDocuments({ isRead: false }),
  ]);

  return {
    notifications: JSON.parse(JSON.stringify(notifications)),
    total,
    unreadCount,
  };
}

// ─── Admin: Get Unread Count (lightweight, for bell badge) ────────────────────

export async function getAdminUnreadCount() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasPermission(session.user.role, "bookings.read")) return 0;

  await dbConnect();
  return AdminNotification.countDocuments({ isRead: false });
}

// ─── Admin: Mark Single Notification Read ─────────────────────────────────────

export async function markAdminNotificationRead(id) {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "bookings.read")) throw new Error("Unauthorized");

  await dbConnect();
  await AdminNotification.findByIdAndUpdate(id, { isRead: true });
  return { success: true };
}

// ─── Admin: Mark All Read ─────────────────────────────────────────────────────

export async function markAllAdminNotificationsRead() {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "bookings.read")) throw new Error("Unauthorized");

  await dbConnect();
  await AdminNotification.updateMany({ isRead: false }, { isRead: true });
  return { success: true };
}
