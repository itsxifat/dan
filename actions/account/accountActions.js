"use server";

import dbConnect from "@/lib/db";
import User from "@/models/User";
import Booking from "@/models/Booking";

/**
 * Get account data for a user — profile, recent bookings, stats.
 */
export async function getAccountData(userId) {
  if (!userId) throw new Error("User ID required.");
  await dbConnect();

  const user = await User.findById(userId)
    .select("name email image phone address role createdAt password")
    .lean();
  if (!user) throw new Error("User not found.");

  const bookings = await Booking.find({ bookedBy: userId })
    .populate("property", "name location coverImage")
    .populate("category", "name")
    .populate("room", "roomNumber floor")
    .populate("roomBookings.room", "roomNumber floor")
    .populate("roomBookings.category", "name")
    .sort({ createdAt: -1 })
    .lean();

  const allBookings = await Booking.find({ bookedBy: userId })
    .select("totalAmount paidAmount bookingMode status")
    .lean();

  const totalBookings   = allBookings.length;
  const totalSpent      = allBookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
  const nightStayCount  = allBookings.filter((b) => b.bookingMode !== "day_long").length;
  const dayLongCount    = allBookings.filter((b) => b.bookingMode === "day_long").length;

  const hasPassword = !!user.password;
  delete user.password;

  return JSON.parse(
    JSON.stringify({
      user: { ...user, hasPassword },
      bookings,
      stats: { totalBookings, totalSpent, nightStayCount, dayLongCount },
    })
  );
}

/**
 * Update user profile fields.
 */
export async function updateProfile({ userId, name, phone, address }) {
  if (!userId) throw new Error("User ID required.");
  if (!name?.trim()) throw new Error("Name is required.");

  await dbConnect();
  await User.findByIdAndUpdate(userId, {
    name: name.trim(),
    phone: (phone || "").trim(),
    address: (address || "").trim(),
  });

  return { success: true };
}

/**
 * Update user profile image.
 */
export async function updateProfileImage({ userId, imageUrl }) {
  if (!userId) throw new Error("User ID required.");
  if (!imageUrl) throw new Error("Image URL required.");

  await dbConnect();
  await User.findByIdAndUpdate(userId, { image: imageUrl });

  return { success: true };
}
