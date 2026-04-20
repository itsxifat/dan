"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import CorporateVisitRequest from "@/models/CorporateVisitRequest";
import CorporateEvent from "@/models/CorporateEvent";
import CorporateVenue from "@/models/CorporateVenue";
import CorporateBrand from "@/models/CorporateBrand";
import { hasPermission } from "@/lib/permissions";
import { createAdminNotification } from "@/actions/notifications/adminNotificationActions";

async function requireCorporate(permission = "corporate.read") {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasPermission(session.user.role, permission)) {
    throw new Error("Unauthorized");
  }
  return session;
}

// ── Public: submit a site-visit request ──────────────────────────────────────
export async function submitVisitRequest(data) {
  await dbConnect();
  if (!data.fullName || !data.company || !data.designation || !data.email ||
      !data.phone || !data.eventSummary || !data.visitDate ||
      !data.visitTime || !data.visitorCount) {
    return { success: false, error: "Please fill in all required fields." };
  }
  try {
    await CorporateVisitRequest.create({
      fullName:     data.fullName,
      company:      data.company,
      designation:  data.designation,
      email:        data.email,
      phone:        data.phone,
      eventType:    data.eventType || "",
      eventSummary: data.eventSummary,
      visitDate:    data.visitDate,
      visitTime:    data.visitTime,
      visitorCount: Number(data.visitorCount) || 1,
      message:      data.message || "",
    });
    createAdminNotification({
      type:    "corporate",
      title:   `Corporate visit request`,
      message: `${data.fullName} · ${data.company} · ${data.visitDate}`,
      link:    "/admin/corporate/visits",
      metadata: { company: data.company, visitDate: data.visitDate },
    }).catch(() => {});
    return { success: true };
  } catch {
    return { success: false, error: "Failed to submit. Please try again." };
  }
}

// ── Public: get published corporate events ───────────────────────────────────
export async function getPublishedCorporateEvents({ limit = 12 } = {}) {
  await dbConnect();
  const events = await CorporateEvent.find({ isPublished: true })
    .sort({ sortOrder: 1, createdAt: -1 })
    .limit(limit)
    .lean();
  return JSON.parse(JSON.stringify(events));
}

// ── Public: get single published event by id ─────────────────────────────────
export async function getCorporateEventById(id) {
  await dbConnect();
  const event = await CorporateEvent.findOne({ _id: id, isPublished: true }).lean();
  return event ? JSON.parse(JSON.stringify(event)) : null;
}

// ── Public: get published venues ─────────────────────────────────────────────
export async function getPublishedVenues() {
  await dbConnect();
  const venues = await CorporateVenue.find({ isPublished: true })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();
  return JSON.parse(JSON.stringify(venues));
}

// ── Public: get published brands ─────────────────────────────────────────────
export async function getPublishedBrands() {
  await dbConnect();
  const brands = await CorporateBrand.find({ isPublished: true })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();
  return JSON.parse(JSON.stringify(brands));
}

// ── Admin: visit requests ─────────────────────────────────────────────────────
export async function getVisitRequests({ page = 1, limit = 20, status = "" } = {}) {
  await requireCorporate("corporate.read");
  await dbConnect();
  const query = status ? { status } : {};
  const skip = (page - 1) * limit;
  const [requests, total] = await Promise.all([
    CorporateVisitRequest.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    CorporateVisitRequest.countDocuments(query),
  ]);
  return {
    requests: JSON.parse(JSON.stringify(requests)),
    total, page, limit,
    pages: Math.ceil(total / limit),
  };
}

export async function updateVisitStatus(id, status) {
  await requireCorporate("corporate.write");
  await dbConnect();
  await CorporateVisitRequest.findByIdAndUpdate(id, { status });
  revalidatePath("/admin/corporate/visits");
  return { success: true };
}

export async function deleteVisitRequest(id) {
  await requireCorporate("corporate.write");
  await dbConnect();
  await CorporateVisitRequest.findByIdAndDelete(id);
  revalidatePath("/admin/corporate/visits");
  return { success: true };
}

// ── Admin: corporate events gallery ──────────────────────────────────────────
export async function getCorporateEvents({ page = 1, limit = 50 } = {}) {
  await requireCorporate("corporate.read");
  await dbConnect();
  const skip = (page - 1) * limit;
  const [events, total] = await Promise.all([
    CorporateEvent.find({}).sort({ sortOrder: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    CorporateEvent.countDocuments(),
  ]);
  return {
    events: JSON.parse(JSON.stringify(events)),
    total, page, limit,
    pages: Math.ceil(total / limit),
  };
}

export async function createCorporateEvent(data) {
  await requireCorporate("corporate.write");
  await dbConnect();
  if (!data.title || !data.image) {
    return { success: false, error: "Title and image are required." };
  }
  await CorporateEvent.create({
    title:       data.title,
    description: data.description || "",
    image:       data.image,
    gallery:     Array.isArray(data.gallery) ? data.gallery : [],
    client:      data.client || "",
    eventDate:   data.eventDate || "",
    tags:        Array.isArray(data.tags) ? data.tags : [],
    isPublished: data.isPublished ?? true,
    sortOrder:   Number(data.sortOrder) || 0,
  });
  revalidatePath("/admin/corporate/manage");
  revalidatePath("/corporate");
  return { success: true };
}

export async function updateCorporateEvent(id, data) {
  await requireCorporate("corporate.write");
  await dbConnect();
  await CorporateEvent.findByIdAndUpdate(id, {
    title:       data.title,
    description: data.description || "",
    image:       data.image,
    gallery:     Array.isArray(data.gallery) ? data.gallery : [],
    client:      data.client || "",
    eventDate:   data.eventDate || "",
    tags:        Array.isArray(data.tags) ? data.tags : [],
    isPublished: data.isPublished ?? true,
    sortOrder:   Number(data.sortOrder) || 0,
  });
  revalidatePath("/admin/corporate/manage");
  revalidatePath("/corporate");
  return { success: true };
}

export async function deleteCorporateEvent(id) {
  await requireCorporate("corporate.write");
  await dbConnect();
  await CorporateEvent.findByIdAndDelete(id);
  revalidatePath("/admin/corporate/manage");
  revalidatePath("/corporate");
  return { success: true };
}

// ── Slug helper ───────────────────────────────────────────────────────────────
function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ── Public: get venue by slug ─────────────────────────────────────────────────
export async function getVenueBySlug(slug) {
  await dbConnect();
  const venue = await CorporateVenue.findOne({ slug, isPublished: true }).lean();
  return venue ? JSON.parse(JSON.stringify(venue)) : null;
}

// ── Admin: venues ─────────────────────────────────────────────────────────────
export async function getCorporateVenues() {
  await requireCorporate("corporate.read");
  await dbConnect();
  const venues = await CorporateVenue.find({}).sort({ sortOrder: 1, createdAt: 1 }).lean();
  return JSON.parse(JSON.stringify(venues));
}

export async function createCorporateVenue(data) {
  await requireCorporate("corporate.write");
  await dbConnect();
  if (!data.name || !data.capacity) {
    return { success: false, error: "Name and capacity are required." };
  }
  const slug = data.slug || slugify(data.name);
  await CorporateVenue.create({
    name:        data.name,
    slug,
    capacity:    data.capacity,
    badge:       data.badge || "",
    description: data.description || "",
    features:    Array.isArray(data.features) ? data.features : [],
    image:       data.image || "",
    gallery:     Array.isArray(data.gallery) ? data.gallery : [],
    isPublished: data.isPublished ?? true,
    sortOrder:   Number(data.sortOrder) || 0,
  });
  revalidatePath("/admin/corporate/manage");
  revalidatePath("/corporate");
  return { success: true };
}

export async function updateCorporateVenue(id, data) {
  await requireCorporate("corporate.write");
  await dbConnect();
  const slug = data.slug || slugify(data.name);
  await CorporateVenue.findByIdAndUpdate(id, {
    name:        data.name,
    slug,
    capacity:    data.capacity,
    badge:       data.badge || "",
    description: data.description || "",
    features:    Array.isArray(data.features) ? data.features : [],
    image:       data.image || "",
    gallery:     Array.isArray(data.gallery) ? data.gallery : [],
    isPublished: data.isPublished ?? true,
    sortOrder:   Number(data.sortOrder) || 0,
  });
  revalidatePath("/admin/corporate/manage");
  revalidatePath("/corporate");
  return { success: true };
}

export async function deleteCorporateVenue(id) {
  await requireCorporate("corporate.write");
  await dbConnect();
  await CorporateVenue.findByIdAndDelete(id);
  revalidatePath("/admin/corporate/manage");
  revalidatePath("/corporate");
  return { success: true };
}

// ── Admin: brands ─────────────────────────────────────────────────────────────
export async function getCorporateBrands() {
  await requireCorporate("corporate.read");
  await dbConnect();
  const brands = await CorporateBrand.find({}).sort({ sortOrder: 1, createdAt: 1 }).lean();
  return JSON.parse(JSON.stringify(brands));
}

export async function createCorporateBrand(data) {
  await requireCorporate("corporate.write");
  await dbConnect();
  if (!data.name) {
    return { success: false, error: "Brand name is required." };
  }
  await CorporateBrand.create({
    name:        data.name,
    logo:        data.logo || "",
    industry:    data.industry || "",
    isPublished: data.isPublished ?? true,
    sortOrder:   Number(data.sortOrder) || 0,
  });
  revalidatePath("/admin/corporate/manage");
  revalidatePath("/corporate");
  return { success: true };
}

export async function updateCorporateBrand(id, data) {
  await requireCorporate("corporate.write");
  await dbConnect();
  await CorporateBrand.findByIdAndUpdate(id, {
    name:        data.name,
    logo:        data.logo || "",
    industry:    data.industry || "",
    isPublished: data.isPublished ?? true,
    sortOrder:   Number(data.sortOrder) || 0,
  });
  revalidatePath("/admin/corporate/manage");
  revalidatePath("/corporate");
  return { success: true };
}

export async function deleteCorporateBrand(id) {
  await requireCorporate("corporate.write");
  await dbConnect();
  await CorporateBrand.findByIdAndDelete(id);
  revalidatePath("/admin/corporate/manage");
  revalidatePath("/corporate");
  return { success: true };
}
