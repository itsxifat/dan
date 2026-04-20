"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import WeddingPhoto from "@/models/WeddingPhoto";
import WeddingEnquiry from "@/models/WeddingEnquiry";
import { hasPermission } from "@/lib/permissions";
import { createAdminNotification } from "@/actions/notifications/adminNotificationActions";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasPermission(session.user.role, "settings.write")) {
    throw new Error("Unauthorized");
  }
}

// ── Public: submit wedding enquiry ────────────────────────────────────────────
export async function submitWeddingEnquiry(data) {
  await dbConnect();
  if (!data.name || !data.email || !data.phone) {
    return { success: false, error: "Please fill in all required fields." };
  }
  try {
    await WeddingEnquiry.create({
      name:       data.name,
      email:      data.email,
      phone:      data.phone,
      eventDate:  data.eventDate  || "",
      guestCount: Number(data.guestCount) || 0,
      venue:      data.venue      || "",
      message:    data.message    || "",
    });
    createAdminNotification({
      type:     "wedding",
      title:    "Wedding enquiry received",
      message:  `${data.name} · ${data.eventDate || "date TBD"}`,
      link:     "/admin/wedding/enquiries",
      metadata: { name: data.name, eventDate: data.eventDate },
    }).catch(() => {});
    return { success: true };
  } catch {
    return { success: false, error: "Failed to submit. Please try again." };
  }
}

// ── Admin: get enquiries ──────────────────────────────────────────────────────
export async function getWeddingEnquiries({ page = 1, limit = 20, status = "" } = {}) {
  await requireAdmin();
  await dbConnect();
  const query = status ? { status } : {};
  const skip  = (page - 1) * limit;
  const [enquiries, total] = await Promise.all([
    WeddingEnquiry.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    WeddingEnquiry.countDocuments(query),
  ]);
  return {
    enquiries: JSON.parse(JSON.stringify(enquiries)),
    total, page, limit,
    pages: Math.ceil(total / limit),
  };
}

export async function updateEnquiryStatus(id, status) {
  await requireAdmin();
  await dbConnect();
  await WeddingEnquiry.findByIdAndUpdate(id, { status });
  revalidatePath("/admin/wedding/enquiries");
  return { success: true };
}

export async function deleteWeddingEnquiry(id) {
  await requireAdmin();
  await dbConnect();
  await WeddingEnquiry.findByIdAndDelete(id);
  revalidatePath("/admin/wedding/enquiries");
  return { success: true };
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
