"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import RoomCategory from "@/models/RoomCategory";
import Room from "@/models/Room";
import { hasPermission } from "@/lib/permissions";
import { slugify, uniqueSlug } from "@/lib/slugify";

async function requireAccom(permission = "accommodation.write") {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasPermission(session.user.role, permission)) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function getProperties({ page = 1, limit = 20, type = "", search = "", onlyActive = false } = {}) {
  await dbConnect();
  const query = {};
  if (type) query.type = type;
  if (onlyActive) query.isActive = true;
  if (search) query.$or = [
    { name: { $regex: search, $options: "i" } },
    { location: { $regex: search, $options: "i" } },
  ];

  const skip = (page - 1) * limit;
  const [properties, total] = await Promise.all([
    Property.find(query).sort({ sortOrder: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    Property.countDocuments(query),
  ]);

  // Attach room counts for buildings
  const ids = properties.filter((p) => p.type === "building").map((p) => p._id);
  const roomCounts = ids.length
    ? await Room.aggregate([
        { $match: { property: { $in: ids } } },
        { $group: { _id: "$property", total: { $sum: 1 }, available: { $sum: { $cond: [{ $eq: ["$status", "available"] }, 1, 0] } } } },
      ])
    : [];
  const countMap = Object.fromEntries(
    roomCounts.map((r) => [r._id.toString(), { total: r.total, available: r.available }])
  );

  return {
    properties: JSON.parse(JSON.stringify(properties)).map((p) => ({
      ...p,
      roomStats: countMap[p._id] || { total: 0, available: 0 },
    })),
    total,
    pages: Math.ceil(total / limit) || 1,
    page,
  };
}

export async function getPropertyBySlug(slug) {
  await dbConnect();
  const property = await Property.findOne({ slug }).lean();
  if (!property) return null;

  if (property.type === "building") {
    const categories = await RoomCategory.find({ property: property._id, isActive: true })
      .sort({ sortOrder: 1 })
      .lean();

    // Available room counts per category
    const catIds = categories.map((c) => c._id);
    const roomStats = await Room.aggregate([
      { $match: { category: { $in: catIds } } },
      { $group: { _id: "$category", total: { $sum: 1 }, available: { $sum: { $cond: [{ $eq: ["$status", "available"] }, 1, 0] } } } },
    ]);
    const statsMap = Object.fromEntries(
      roomStats.map((r) => [r._id.toString(), { total: r.total, available: r.available }])
    );

    return JSON.parse(JSON.stringify({
      ...property,
      categories: categories.map((c) => ({
        ...c,
        roomStats: statsMap[c._id.toString()] || { total: 0, available: 0 },
      })),
    }));
  }

  return JSON.parse(JSON.stringify(property));
}

export async function createProperty(data) {
  const session = await requireAccom("accommodation.write");
  await dbConnect();

  const base = slugify(data.name);
  const slug = await uniqueSlug(Property, base);

  const property = await Property.create({
    ...data,
    slug,
    createdBy: session.user.id,
    updatedAt: new Date(),
  });

  revalidatePath("/accommodation");
  revalidatePath("/admin/accommodation");
  return { success: true, id: property._id.toString() };
}

export async function updateProperty(propertyId, data) {
  await requireAccom("accommodation.write");
  await dbConnect();

  await Property.findByIdAndUpdate(propertyId, { ...data, updatedAt: new Date() });

  revalidatePath("/accommodation");
  revalidatePath(`/accommodation/${data.slug || ""}`);
  revalidatePath("/admin/accommodation");
  return { success: true };
}

export async function deleteProperty(propertyId) {
  await requireAccom("accommodation.write");
  await dbConnect();

  await Promise.all([
    Property.findByIdAndDelete(propertyId),
    RoomCategory.deleteMany({ property: propertyId }),
    Room.deleteMany({ property: propertyId }),
  ]);

  revalidatePath("/accommodation");
  revalidatePath("/admin/accommodation");
  return { success: true };
}

export async function togglePropertyActive(propertyId) {
  await requireAccom("accommodation.write");
  await dbConnect();
  const p = await Property.findById(propertyId);
  await Property.findByIdAndUpdate(propertyId, { isActive: !p.isActive, updatedAt: new Date() });
  revalidatePath("/admin/accommodation");
  revalidatePath("/accommodation");
  return { success: true };
}

export async function togglePropertyFeatured(propertyId) {
  await requireAccom("accommodation.write");
  await dbConnect();
  const p = await Property.findById(propertyId);
  await Property.findByIdAndUpdate(propertyId, { isFeatured: !p.isFeatured, updatedAt: new Date() });
  revalidatePath("/admin/accommodation");
  revalidatePath("/accommodation");
  return { success: true };
}
