"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import RoomCategory from "@/models/RoomCategory";
import Room from "@/models/Room";
import { hasPermission } from "@/lib/permissions";
import { slugify, uniqueSlug } from "@/lib/slugify";

async function requireAccom() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasPermission(session.user.role, "accommodation.write")) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function getCategoriesByProperty(propertyId) {
  await dbConnect();
  const categories = await RoomCategory.find({ property: propertyId })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();

  const ids = categories.map((c) => c._id);
  const roomStats = ids.length
    ? await Room.aggregate([
        { $match: { category: { $in: ids } } },
        { $group: {
          _id: "$category",
          total:     { $sum: 1 },
          available: { $sum: { $cond: [{ $eq: ["$status", "available"] }, 1, 0] } },
        }},
      ])
    : [];
  const statsMap = Object.fromEntries(roomStats.map((r) => [r._id.toString(), r]));

  return JSON.parse(JSON.stringify(
    categories.map((c) => ({
      ...c,
      roomStats: statsMap[c._id.toString()] || { total: 0, available: 0 },
    }))
  ));
}

export async function getCategoryBySlug(propertyId, slug) {
  await dbConnect();
  const category = await RoomCategory.findOne({ property: propertyId, slug }).lean();
  if (!category) return null;

  const rooms = await Room.find({ category: category._id }).sort({ floor: 1, roomNumber: 1 }).lean();
  return JSON.parse(JSON.stringify({ ...category, rooms }));
}

export async function createCategory(propertyId, data) {
  await requireAccom();
  await dbConnect();

  const base = slugify(data.name);
  // Slug must be unique within a property
  let slug = base;
  let counter = 2;
  while (await RoomCategory.exists({ property: propertyId, slug })) {
    slug = `${base}-${counter++}`;
  }

  await RoomCategory.create({ ...data, property: propertyId, slug, updatedAt: new Date() });

  revalidatePath("/admin/accommodation");
  return { success: true };
}

export async function updateCategory(categoryId, data) {
  await requireAccom();
  await dbConnect();
  await RoomCategory.findByIdAndUpdate(categoryId, { ...data, updatedAt: new Date() });
  revalidatePath("/admin/accommodation");
  return { success: true };
}

export async function deleteCategory(categoryId) {
  await requireAccom();
  await dbConnect();

  const roomCount = await Room.countDocuments({ category: categoryId });
  if (roomCount > 0) {
    throw new Error(`Cannot delete: ${roomCount} room(s) exist in this category. Remove them first.`);
  }

  await RoomCategory.findByIdAndDelete(categoryId);
  revalidatePath("/admin/accommodation");
  return { success: true };
}
