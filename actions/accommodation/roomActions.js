"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import Room from "@/models/Room";
import Booking from "@/models/Booking";
import { hasPermission } from "@/lib/permissions";

async function requireAccom() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasPermission(session.user.role, "accommodation.write")) {
    throw new Error("Unauthorized");
  }
}

export async function getAllRooms({ propertyId = null, categoryId = null } = {}) {
  await dbConnect();
  const filter = {};
  if (propertyId)  filter.property  = propertyId;
  if (categoryId)  filter.category  = categoryId;
  const rooms = await Room.find(filter)
    .populate("property",  "name")
    .populate("category",  "name pricePerNight bedType")
    .sort({ "property": 1, floor: 1, roomNumber: 1 })
    .lean();
  return JSON.parse(JSON.stringify(rooms));
}

export async function getRoomsByCategory(categoryId) {
  await dbConnect();
  const rooms = await Room.find({ category: categoryId })
    .sort({ floor: 1, roomNumber: 1 })
    .lean();
  return JSON.parse(JSON.stringify(rooms));
}

export async function getRoomById(roomId) {
  await dbConnect();
  const room = await Room.findById(roomId)
    .populate("category", "name slug pricePerNight bedType amenities images")
    .populate("property", "name slug location amenities")
    .lean();
  return room ? JSON.parse(JSON.stringify(room)) : null;
}

export async function createRoom(data) {
  await requireAccom();
  await dbConnect();

  const exists = await Room.exists({ property: data.property, roomNumber: data.roomNumber });
  if (exists) throw new Error(`Room number "${data.roomNumber}" already exists in this property.`);

  await Room.create({ ...data, updatedAt: new Date() });
  revalidatePath("/admin/accommodation");
  return { success: true };
}

export async function updateRoom(roomId, data) {
  await requireAccom();
  await dbConnect();
  await Room.findByIdAndUpdate(roomId, { ...data, updatedAt: new Date() });
  revalidatePath("/admin/accommodation");
  return { success: true };
}

export async function deleteRoom(roomId) {
  await requireAccom();
  await dbConnect();

  const activeBooking = await Booking.exists({
    room: roomId,
    status: { $in: ["pending", "confirmed", "checked_in"] },
  });
  if (activeBooking) throw new Error("Cannot delete: room has active bookings.");

  await Room.findByIdAndDelete(roomId);
  revalidatePath("/admin/accommodation");
  return { success: true };
}

export async function updateRoomStatus(roomId, status) {
  await requireAccom();
  await dbConnect();
  const STATUSES = ["available", "occupied", "maintenance", "blocked"];
  if (!STATUSES.includes(status)) throw new Error("Invalid status");
  await Room.findByIdAndUpdate(roomId, { status, updatedAt: new Date() });
  revalidatePath("/admin/accommodation");
  return { success: true };
}

/** Public-safe: check if a specific room is available for given dates */
export async function checkRoomAvailability(roomId, checkIn, checkOut) {
  await dbConnect();
  const room = await Room.findById(roomId).lean();
  if (!room || room.status !== "available") return false;

  const conflict = await Booking.exists({
    room: roomId,
    status: { $nin: ["cancelled", "no_show"] },
    checkIn:  { $lt: new Date(checkOut) },
    checkOut: { $gt: new Date(checkIn) },
  });
  return !conflict;
}

/** Public-safe: returns rooms in a category available for the given date range */
export async function getAvailableRooms(categoryId, checkIn, checkOut) {
  await dbConnect();

  const allRooms = await Room.find({ category: categoryId, status: "available" }).lean();
  if (!allRooms.length) return [];

  const roomIds = allRooms.map((r) => r._id);
  const bookedRoomIds = await Booking.distinct("room", {
    room:     { $in: roomIds },
    status:   { $nin: ["cancelled", "no_show"] },
    checkIn:  { $lt: new Date(checkOut) },
    checkOut: { $gt: new Date(checkIn) },
  });

  const bookedSet = new Set(bookedRoomIds.map(String));
  const available = allRooms.filter((r) => !bookedSet.has(r._id.toString()));
  return JSON.parse(JSON.stringify(available));
}
