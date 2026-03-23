"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import Settings from "@/models/Settings";
import { hasPermission } from "@/lib/permissions";

/** Public-safe — returns settings or defaults */
export async function getSettings() {
  await dbConnect();
  let settings = await Settings.findOne().lean();
  if (!settings) {
    settings = await Settings.create({});
    return JSON.parse(JSON.stringify(settings));
  }
  return JSON.parse(JSON.stringify(settings));
}

export async function updateSettings(data) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasPermission(session.user.role, "settings.write")) {
    throw new Error("Unauthorized");
  }

  await dbConnect();
  const existing = await Settings.findOne();

  if (existing) {
    await Settings.findByIdAndUpdate(existing._id, {
      ...data,
      updatedAt: new Date(),
      updatedBy: session.user.id,
    });
  } else {
    await Settings.create({ ...data, updatedBy: session.user.id });
  }

  revalidatePath("/admin/settings");
  return { success: true };
}
