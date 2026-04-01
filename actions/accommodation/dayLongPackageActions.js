"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import DayLongPackage from "@/models/DayLongPackage";
import { hasPermission } from "@/lib/permissions";

async function requireWrite() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasPermission(session.user.role, "accommodation.write")) {
    throw new Error("Unauthorized");
  }
}

export async function getDayLongPackages() {
  await dbConnect();
  const packages = await DayLongPackage.find({})
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();
  return JSON.parse(JSON.stringify(packages));
}

export async function getActiveDayLongPackages() {
  await dbConnect();
  const packages = await DayLongPackage.find({ isActive: true })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();
  return JSON.parse(JSON.stringify(packages));
}

export async function createDayLongPackage(data) {
  await requireWrite();
  await dbConnect();
  await DayLongPackage.create({ ...data, updatedAt: new Date() });
  revalidatePath("/admin/daylong-packages");
  revalidatePath("/");
  return { success: true };
}

export async function updateDayLongPackage(packageId, data) {
  await requireWrite();
  await dbConnect();
  await DayLongPackage.findByIdAndUpdate(packageId, { ...data, updatedAt: new Date() });
  revalidatePath("/admin/daylong-packages");
  revalidatePath("/");
  return { success: true };
}

export async function deleteDayLongPackage(packageId) {
  await requireWrite();
  await dbConnect();
  await DayLongPackage.findByIdAndDelete(packageId);
  revalidatePath("/admin/daylong-packages");
  revalidatePath("/");
  return { success: true };
}
