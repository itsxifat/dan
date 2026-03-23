"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import Wishlist from "@/models/Wishlist";

export async function getWishlist() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  await dbConnect();
  const items = await Wishlist.find({ user: session.user.id })
    .populate("property", "name slug type coverImage location pricePerNight tagline")
    .sort({ addedAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(items));
}

export async function toggleWishlist(propertyId) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Sign in to save to wishlist");

  await dbConnect();
  const existing = await Wishlist.findOne({ user: session.user.id, property: propertyId });

  if (existing) {
    await Wishlist.findByIdAndDelete(existing._id);
    revalidatePath("/account/wishlist");
    return { saved: false };
  }

  await Wishlist.create({ user: session.user.id, property: propertyId });
  revalidatePath("/account/wishlist");
  return { saved: true };
}

export async function isWishlisted(propertyId) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return false;

  await dbConnect();
  return !!(await Wishlist.exists({ user: session.user.id, property: propertyId }));
}
