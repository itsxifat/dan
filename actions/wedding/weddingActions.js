"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import WeddingPhoto from "@/models/WeddingPhoto";
import { hasPermission } from "@/lib/permissions";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasPermission(session.user.role, "settings.write")) {
    throw new Error("Unauthorized");
  }
}

// ── Public ────────────────────────────────────────────────────────────────────
export async function getPublishedWeddingPhotos({ limit = 100 } = {}) {
  await dbConnect();
  const photos = await WeddingPhoto.find({ isPublished: true })
    .sort({ category: 1, sortOrder: 1, createdAt: -1 })
    .limit(limit)
    .lean();
  return JSON.parse(JSON.stringify(photos));
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export async function getAllWeddingPhotos({ page = 1, limit = 48 } = {}) {
  await requireAdmin();
  await dbConnect();
  const skip = (page - 1) * limit;
  const [photos, total] = await Promise.all([
    WeddingPhoto.find({})
      .sort({ category: 1, sortOrder: 1, createdAt: -1 })
      .skip(skip).limit(limit).lean(),
    WeddingPhoto.countDocuments(),
  ]);
  return {
    photos: JSON.parse(JSON.stringify(photos)),
    total, page, limit,
    pages: Math.ceil(total / limit),
  };
}

export async function createWeddingPhoto(data) {
  await requireAdmin();
  await dbConnect();
  if (!data.image) return { success: false, error: "Image is required." };
  await WeddingPhoto.create({
    title:       data.title || "",
    image:       data.image,
    altText:     data.altText || "",
    category:    data.category || "General",
    span:        data.span || "none",
    isPublished: data.isPublished ?? true,
    sortOrder:   Number(data.sortOrder) || 0,
  });
  revalidatePath("/destination-wedding");
  return { success: true };
}

export async function updateWeddingPhoto(id, data) {
  await requireAdmin();
  await dbConnect();
  await WeddingPhoto.findByIdAndUpdate(id, {
    title:       data.title || "",
    image:       data.image,
    altText:     data.altText || "",
    category:    data.category || "General",
    span:        data.span || "none",
    isPublished: data.isPublished ?? true,
    sortOrder:   Number(data.sortOrder) || 0,
  });
  revalidatePath("/destination-wedding");
  return { success: true };
}

export async function deleteWeddingPhoto(id) {
  await requireAdmin();
  await dbConnect();
  await WeddingPhoto.findByIdAndDelete(id);
  revalidatePath("/destination-wedding");
  return { success: true };
}

export async function bulkToggleWeddingPublish(ids, isPublished) {
  await requireAdmin();
  await dbConnect();
  await WeddingPhoto.updateMany({ _id: { $in: ids } }, { isPublished });
  revalidatePath("/destination-wedding");
  return { success: true };
}
