"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import WeddingVenue from "@/models/WeddingVenue";
import { hasPermission } from "@/lib/permissions";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasPermission(session.user.role, "settings.write")) {
    throw new Error("Unauthorized");
  }
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ── Public ────────────────────────────────────────────────────────────────────
export async function getPublishedVenues() {
  await dbConnect();
  const venues = await WeddingVenue.find({ isPublished: true })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();
  return JSON.parse(JSON.stringify(venues));
}

export async function getVenueBySlug(slug) {
  await dbConnect();
  const venue = await WeddingVenue.findOne({ slug, isPublished: true }).lean();
  return venue ? JSON.parse(JSON.stringify(venue)) : null;
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export async function getAllVenues() {
  await requireAdmin();
  await dbConnect();
  const venues = await WeddingVenue.find({})
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();
  return JSON.parse(JSON.stringify(venues));
}

export async function createVenue(data) {
  await requireAdmin();
  await dbConnect();
  if (!data.name) return { success: false, error: "Name is required." };

  const baseSlug = slugify(data.name);
  let slug = baseSlug;
  let i = 1;
  while (await WeddingVenue.findOne({ slug })) {
    slug = `${baseSlug}-${i++}`;
  }

  await WeddingVenue.create({
    name:        data.name,
    slug,
    capacity:    data.capacity || "",
    badge:       data.badge || "",
    description: data.description || "",
    features:    Array.isArray(data.features) ? data.features.filter(Boolean) : [],
    coverImage:  data.coverImage || "",
    images:      Array.isArray(data.images) ? data.images.filter(Boolean) : [],
    isPublished: data.isPublished ?? true,
    sortOrder:   Number(data.sortOrder) || 0,
  });

  revalidatePath("/destination-wedding");
  return { success: true };
}

export async function updateVenue(id, data) {
  await requireAdmin();
  await dbConnect();

  const existing = await WeddingVenue.findById(id);
  if (!existing) return { success: false, error: "Venue not found." };

  // Re-slug only if name changed
  let slug = existing.slug;
  if (data.name && data.name !== existing.name) {
    const baseSlug = slugify(data.name);
    slug = baseSlug;
    let i = 1;
    while (await WeddingVenue.findOne({ slug, _id: { $ne: id } })) {
      slug = `${baseSlug}-${i++}`;
    }
  }

  await WeddingVenue.findByIdAndUpdate(id, {
    name:        data.name,
    slug,
    capacity:    data.capacity || "",
    badge:       data.badge || "",
    description: data.description || "",
    features:    Array.isArray(data.features) ? data.features.filter(Boolean) : [],
    coverImage:  data.coverImage || "",
    images:      Array.isArray(data.images) ? data.images.filter(Boolean) : [],
    isPublished: data.isPublished ?? true,
    sortOrder:   Number(data.sortOrder) || 0,
  });

  revalidatePath("/destination-wedding");
  revalidatePath(`/destination-wedding/venues/${slug}`);
  return { success: true };
}

export async function deleteVenue(id) {
  await requireAdmin();
  await dbConnect();
  await WeddingVenue.findByIdAndDelete(id);
  revalidatePath("/destination-wedding");
  return { success: true };
}
