"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import Notification from "@/models/Notification";
import { hasPermission } from "@/lib/permissions";

// ─── Admin: Send Notification ────────────────────────────────────────────────

export async function sendNotification(data) {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "settings.write")) throw new Error("Unauthorized");

  await dbConnect();

  const doc = await Notification.create({
    type:          data.type || "message",
    targetType:    data.targetType || "all",
    targetUser:    data.targetUserId || null,
    header:        data.header,
    body:          data.body,
    image:         data.image || "",
    linkedDiscount: data.linkedDiscountId || null,
    metadata:      data.metadata || {},
    isActive:      true,
    createdBy:     session.user.id,
  });

  revalidatePath("/admin/send-notification");
  return { success: true, id: doc._id.toString() };
}

// ─── Admin: List Sent Notifications ──────────────────────────────────────────

export async function getAdminNotifications({ page = 1, limit = 20 } = {}) {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "settings.write")) throw new Error("Unauthorized");

  await dbConnect();

  const skip = (page - 1) * limit;
  const [notifications, total] = await Promise.all([
    Notification.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("targetUser", "name email")
      .populate("createdBy", "name")
      .lean(),
    Notification.countDocuments(),
  ]);

  return {
    notifications: JSON.parse(JSON.stringify(notifications)),
    total,
  };
}

// ─── Admin: Delete Notification ───────────────────────────────────────────────

export async function deleteNotification(id) {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "settings.write")) throw new Error("Unauthorized");

  await dbConnect();
  await Notification.findByIdAndDelete(id);
  revalidatePath("/admin/send-notification");
  return { success: true };
}

// ─── Public: Get Notifications For Current User ───────────────────────────────

export async function getUserNotifications() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { notifications: [], unreadCount: 0 };

  await dbConnect();

  const userId = session.user.id;
  const now    = new Date();

  // Personal notifications for this user
  const personal = await Notification.find({
    targetType: "user",
    targetUser: userId,
    isActive:   true,
  }).sort({ createdAt: -1 }).limit(50).lean();

  // Broadcast notifications (targetType = "all")
  const broadcast = await Notification.find({
    targetType: "all",
    isActive:   true,
  }).sort({ createdAt: -1 }).limit(50).lean();

  // Merge and sort by date
  const all = [...personal, ...broadcast].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  // Compute isRead per item for the current user
  const enriched = all.map((n) => {
    const isRead =
      n.targetType === "user"
        ? n.isRead
        : (n.readBy || []).some((id) => id.toString() === userId);
    return { ...n, _id: n._id.toString(), isRead };
  });

  const unreadCount = enriched.filter((n) => !n.isRead).length;

  return {
    notifications: JSON.parse(JSON.stringify(enriched)),
    unreadCount,
  };
}

// ─── Public: Get Unread Count Only (lightweight for nav badge) ────────────────

export async function getUnreadNotificationCount() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return 0;

  await dbConnect();

  const userId = session.user.id;

  const [personalUnread, broadcastAll] = await Promise.all([
    Notification.countDocuments({
      targetType: "user",
      targetUser: userId,
      isActive:   true,
      isRead:     false,
    }),
    Notification.find({
      targetType: "all",
      isActive:   true,
    }).select("readBy").lean(),
  ]);

  const broadcastUnread = broadcastAll.filter(
    (n) => !(n.readBy || []).some((id) => id.toString() === userId)
  ).length;

  return personalUnread + broadcastUnread;
}

// ─── Public: Mark Notification as Read ───────────────────────────────────────

export async function markNotificationRead(id) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Not authenticated");

  await dbConnect();

  const notif = await Notification.findById(id);
  if (!notif) return { success: true };

  if (notif.targetType === "user") {
    notif.isRead = true;
  } else {
    // Broadcast — add user to readBy if not already there
    const userId = session.user.id;
    if (!notif.readBy.some((id) => id.toString() === userId)) {
      notif.readBy.push(userId);
    }
  }

  await notif.save();
  return { success: true };
}

// ─── Public: Mark All Notifications Read ─────────────────────────────────────

export async function markAllNotificationsRead() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Not authenticated");

  await dbConnect();

  const userId = session.user.id;

  // Mark personal notifications
  await Notification.updateMany(
    { targetType: "user", targetUser: userId, isRead: false, isActive: true },
    { isRead: true }
  );

  // For broadcast: add userId to readBy on all unread ones
  const unreadBroadcasts = await Notification.find({
    targetType: "all",
    isActive:   true,
    readBy:     { $ne: userId },
  }).select("_id");

  await Promise.all(
    unreadBroadcasts.map((n) =>
      Notification.findByIdAndUpdate(n._id, { $addToSet: { readBy: userId } })
    )
  );

  return { success: true };
}

// ─── Internal: Create System Notification (from server code) ─────────────────

export async function createSystemNotification({ targetUserId, type, header, body, metadata = {} }) {
  await dbConnect();
  await Notification.create({
    type,
    targetType: targetUserId ? "user" : "all",
    targetUser: targetUserId || null,
    header,
    body,
    metadata,
    isActive: true,
  });
}
