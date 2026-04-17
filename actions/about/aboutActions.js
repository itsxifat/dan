"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import AboutPage from "@/models/AboutPage";
import { hasPermission } from "@/lib/permissions";

export async function getAboutPage() {
  await dbConnect();
  let doc = await AboutPage.findOne().lean();
  if (!doc) {
    doc = await AboutPage.create({});
  }
  return JSON.parse(JSON.stringify(doc));
}

export async function updateAboutPage(data) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasPermission(session.user.role, "settings.write")) {
    throw new Error("Unauthorized");
  }
  await dbConnect();
  const existing = await AboutPage.findOne();
  const payload = { ...data, updatedAt: new Date() };
  if (existing) {
    await AboutPage.findByIdAndUpdate(existing._id, payload);
  } else {
    await AboutPage.create(payload);
  }
  revalidatePath("/about");
  revalidatePath("/admin/about");
  return { success: true };
}
