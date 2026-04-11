"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import Amenity from "@/models/Amenity";
import { hasPermission } from "@/lib/permissions";

function slugify(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function requireWrite() {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "accommodation.write")) throw new Error("Unauthorized");
}

export async function getAmenities({ onlyActive = false } = {}) {
  await dbConnect();
  const q = onlyActive ? { isActive: true } : {};
  const amenities = await Amenity.find(q).sort({ sortOrder: 1, name: 1 }).lean();
  return JSON.parse(JSON.stringify(amenities));
}

export async function createAmenity(data) {
  await requireWrite();
  await dbConnect();

  let slug = slugify(data.name);
  // make unique
  const existing = await Amenity.findOne({ slug });
  if (existing) slug = `${slug}-${Date.now()}`;

  await Amenity.create({ ...data, slug });
  revalidatePath("/admin/amenities");
  return { success: true };
}

export async function updateAmenity(id, data) {
  await requireWrite();
  await dbConnect();
  await Amenity.findByIdAndUpdate(id, data);
  revalidatePath("/admin/amenities");
  return { success: true };
}

export async function deleteAmenity(id) {
  await requireWrite();
  await dbConnect();
  await Amenity.findByIdAndDelete(id);
  revalidatePath("/admin/amenities");
  return { success: true };
}
