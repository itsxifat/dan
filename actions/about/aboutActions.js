"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import AboutPage from "@/models/AboutPage";
import { hasPermission } from "@/lib/permissions";
import { sanitize, sanitizeString } from "@/lib/sanitize";

export async function getAboutPage() {
  await dbConnect();
  let doc = await AboutPage.findOne().lean();
  if (!doc) {
    doc = await AboutPage.create({});
  }
  return JSON.parse(JSON.stringify(doc));
}

const TEXT_FIELDS = [
  "chairmanName",
  "chairmanTitle",
  "chairmanOrganization",
  "chairmanImage",
  "chairmanQuote",
  "chairmanMessagePara1",
  "chairmanMessagePara2",
];

const MAX_EXECUTIVES = 60;

export async function updateAboutPage(data) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasPermission(session.user.role, "settings.write")) {
    throw new Error("Unauthorized");
  }
  await dbConnect();

  // Build the update from a fixed field list rather than spreading the caller's
  // object — an admin form post must not be able to set arbitrary document keys.
  const clean   = sanitize(data) ?? {};
  const payload = { updatedAt: new Date() };

  for (const key of TEXT_FIELDS) {
    if (clean[key] !== undefined) payload[key] = sanitizeString(clean[key], 4000);
  }

  if (clean.executives !== undefined) {
    payload.executives = (Array.isArray(clean.executives) ? clean.executives : [])
      .slice(0, MAX_EXECUTIVES)
      .map((m) => ({
        name:  sanitizeString(m?.name,  160),
        role:  sanitizeString(m?.role,  160),
        image: sanitizeString(m?.image, 2000),
      }))
      // A card needs at least a name or a face to be worth rendering. Dropping
      // the rest here keeps this in step with the public filter, so an
      // incomplete row disappears from the form on reload rather than saving
      // silently and never showing up on /about.
      .filter((m) => m.name || m.image);
  }

  const existing = await AboutPage.findOne();
  if (existing) {
    await AboutPage.findByIdAndUpdate(existing._id, payload);
  } else {
    await AboutPage.create(payload);
  }
  revalidatePath("/about");
  revalidatePath("/admin/about");
  return { success: true };
}
