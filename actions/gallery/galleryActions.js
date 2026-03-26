"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import GalleryPhoto from "@/models/GalleryPhoto";
import { hasPermission } from "@/lib/permissions";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasPermission(session.user.role, "settings.write")) {
    throw new Error("Unauthorized");
  }
}

// ── Public ────────────────────────────────────────────────────────────────────
export async function getPublishedGalleryPhotos({ limit = 24 } = {}) {
  await dbConnect();
  const photos = await GalleryPhoto.find({ isPublished: true })
    .sort({ sortOrder: 1, createdAt: -1 })
    .limit(limit)
    .lean();
  return JSON.parse(JSON.stringify(photos));
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export async function getAllGalleryPhotos({ page = 1, limit = 48 } = {}) {
  await requireAdmin();
  await dbConnect();
  const skip = (page - 1) * limit;
  const [photos, total] = await Promise.all([
    GalleryPhoto.find({}).sort({ category: 1, sortOrder: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    GalleryPhoto.countDocuments(),
  ]);
  return {
    photos: JSON.parse(JSON.stringify(photos)),
    total, page, limit,
    pages: Math.ceil(total / limit),
  };
}

export async function createGalleryPhoto(data) {
  await requireAdmin();
  await dbConnect();
  if (!data.image) return { success: false, error: "Image is required." };
  await GalleryPhoto.create({
    title:       data.title || "",
    image:       data.image,
    altText:     data.altText || "",
    category:    data.category || "General",
    isPublished: data.isPublished ?? true,
    sortOrder:   Number(data.sortOrder) || 0,
  });
  revalidatePath("/");
  return { success: true };
}

export async function updateGalleryPhoto(id, data) {
  await requireAdmin();
  await dbConnect();
  await GalleryPhoto.findByIdAndUpdate(id, {
    title:       data.title || "",
    image:       data.image,
    altText:     data.altText || "",
    category:    data.category || "General",
    isPublished: data.isPublished ?? true,
    sortOrder:   Number(data.sortOrder) || 0,
  });
  revalidatePath("/");
  return { success: true };
}

export async function deleteGalleryPhoto(id) {
  await requireAdmin();
  await dbConnect();
  await GalleryPhoto.findByIdAndDelete(id);
  revalidatePath("/");
  return { success: true };
}

export async function bulkTogglePublish(ids, isPublished) {
  await requireAdmin();
  await dbConnect();
  await GalleryPhoto.updateMany({ _id: { $in: ids } }, { isPublished });
  revalidatePath("/");
  return { success: true };
}
