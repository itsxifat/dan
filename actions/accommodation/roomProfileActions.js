"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import dbConnect from "@/lib/db";
import Room from "@/models/Room";

/**
 * Get full room profile with populated category and property.
 */
export async function getRoomProfile(roomId) {
  if (!roomId) throw new Error("Room ID required.");
  await dbConnect();

  const room = await Room.findById(roomId)
    .populate("category", "name slug pricePerNight maxAdults maxChildren bedType size amenities coverImage description variants")
    .populate("property", "name slug location coverImage")
    .lean();

  if (!room) throw new Error("Room not found.");
  return JSON.parse(JSON.stringify(room));
}

/**
 * Update room profile extra info — admin only.
 */
export async function updateRoomProfile({
  roomId,
  facilities,
  videos,
  extraAmenities,
  description,
  coverImage,
  images,
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasPermission(session.user.role, "accommodation.write")) {
    throw new Error("Unauthorized.");
  }

  if (!roomId) throw new Error("Room ID required.");
  await dbConnect();

  await Room.findByIdAndUpdate(roomId, {
    ...(facilities      !== undefined && { facilities }),
    ...(videos          !== undefined && { videos }),
    ...(extraAmenities  !== undefined && { extraAmenities }),
    ...(description     !== undefined && { description }),
    ...(coverImage      !== undefined && { coverImage }),
    ...(images          !== undefined && { images }),
    updatedAt: new Date(),
  });

  return { success: true };
}
