"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import CorporateVisitRequest from "@/models/CorporateVisitRequest";
import CorporateEvent from "@/models/CorporateEvent";
import { hasPermission } from "@/lib/permissions";

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
export async function getCorporateEvents({ page = 1, limit = 20 } = {}) {
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
    client:      data.client || "",
    eventDate:   data.eventDate || "",
    tags:        Array.isArray(data.tags) ? data.tags : [],
    isPublished: data.isPublished ?? true,
    sortOrder:   Number(data.sortOrder) || 0,
  });
  revalidatePath("/admin/corporate/events");
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
    client:      data.client || "",
    eventDate:   data.eventDate || "",
    tags:        Array.isArray(data.tags) ? data.tags : [],
    isPublished: data.isPublished ?? true,
    sortOrder:   Number(data.sortOrder) || 0,
  });
  revalidatePath("/admin/corporate/events");
  revalidatePath("/corporate");
  return { success: true };
}

export async function deleteCorporateEvent(id) {
  await requireCorporate("corporate.write");
  await dbConnect();
  await CorporateEvent.findByIdAndDelete(id);
  revalidatePath("/admin/corporate/events");
  revalidatePath("/corporate");
  return { success: true };
}
