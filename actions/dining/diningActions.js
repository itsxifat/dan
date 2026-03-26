"use server";

import dbConnect from "@/lib/db";
import MenuItem from "@/models/MenuItem";

// ── Public ─────────────────────────────────────────────────────────────────────

export async function getMenuByVenue(venue) {
  await dbConnect();
  const items = await MenuItem.find({ venue, isAvailable: true })
    .sort({ category: 1, sortOrder: 1, createdAt: 1 })
    .lean();
  return JSON.parse(JSON.stringify(items));
}

export async function getFeaturedMenuItems(venue, limit = 6) {
  await dbConnect();
  const items = await MenuItem.find({ venue, isAvailable: true, isPopular: true })
    .sort({ sortOrder: 1 })
    .limit(limit)
    .lean();
  return JSON.parse(JSON.stringify(items));
}

// ── Admin ──────────────────────────────────────────────────────────────────────

export async function getAllMenuItems(venue) {
  await dbConnect();
  const query = venue ? { venue } : {};
  const items = await MenuItem.find(query)
    .sort({ venue: 1, category: 1, sortOrder: 1 })
    .lean();
  return JSON.parse(JSON.stringify(items));
}

export async function createMenuItem(data) {
  await dbConnect();
  const item = await MenuItem.create(data);
  return JSON.parse(JSON.stringify(item));
}

export async function updateMenuItem(id, data) {
  await dbConnect();
  await MenuItem.findByIdAndUpdate(id, data);
}

export async function deleteMenuItem(id) {
  await dbConnect();
  await MenuItem.findByIdAndDelete(id);
}

export async function toggleMenuItemAvailability(id, isAvailable) {
  await dbConnect();
  await MenuItem.findByIdAndUpdate(id, { isAvailable });
}
