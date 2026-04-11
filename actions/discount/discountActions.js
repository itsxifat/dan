"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import Discount from "@/models/Discount";
import { hasPermission } from "@/lib/permissions";

// ─── Admin: Create Discount / Offer / Coupon ─────────────────────────────────

export async function createDiscount(data) {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "settings.write")) throw new Error("Unauthorized");

  await dbConnect();

  const doc = await Discount.create({
    ...data,
    code: data.code ? data.code.toUpperCase().trim() : null,
    usedCount: 0,
    createdBy: session.user.id,
  });

  revalidatePath("/admin/discounts");
  return { success: true, id: doc._id.toString() };
}

// ─── Admin: Update Discount ───────────────────────────────────────────────────

export async function updateDiscount(id, data) {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "settings.write")) throw new Error("Unauthorized");

  await dbConnect();

  const update = {
    ...data,
    code: data.code ? data.code.toUpperCase().trim() : null,
    updatedAt: new Date(),
  };

  await Discount.findByIdAndUpdate(id, update);
  revalidatePath("/admin/discounts");
  return { success: true };
}

// ─── Admin: Delete Discount ───────────────────────────────────────────────────

export async function deleteDiscount(id) {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "settings.write")) throw new Error("Unauthorized");

  await dbConnect();
  await Discount.findByIdAndDelete(id);
  revalidatePath("/admin/discounts");
  return { success: true };
}

// ─── Admin: List Discounts ────────────────────────────────────────────────────

export async function getAdminDiscounts({ type = "", search = "" } = {}) {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "settings.write")) throw new Error("Unauthorized");

  await dbConnect();

  const query = {};
  if (type) query.type = type;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { code: { $regex: search, $options: "i" } },
    ];
  }

  const discounts = await Discount.find(query)
    .populate("assignedUser", "name email")
    .populate("createdBy", "name")
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(discounts));
}

// ─── Admin: Toggle Active ─────────────────────────────────────────────────────

export async function toggleDiscountActive(id) {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "settings.write")) throw new Error("Unauthorized");

  await dbConnect();
  const disc = await Discount.findById(id);
  if (!disc) throw new Error("Not found");
  disc.isActive = !disc.isActive;
  disc.updatedAt = new Date();
  await disc.save();
  revalidatePath("/admin/discounts");
  return { success: true, isActive: disc.isActive };
}

// ─── Public: Validate Coupon Code ─────────────────────────────────────────────
// Returns the discount details if valid, throws a descriptive error if not.

export async function validateCoupon({ code, bookingMode, orderTotal, userId }) {
  await dbConnect();

  if (!code?.trim()) throw new Error("Please enter a coupon code.");

  const disc = await Discount.findOne({
    code: code.toUpperCase().trim(),
    type: "coupon",
    isActive: true,
  }).lean();

  if (!disc) throw new Error("Invalid coupon code. Please check and try again.");

  const now = new Date();
  if (now < new Date(disc.validFrom)) throw new Error("This coupon is not active yet.");
  if (now > new Date(disc.validTo))   throw new Error("This coupon has expired.");

  if (disc.usageLimit > 0 && disc.usedCount >= disc.usageLimit) {
    throw new Error("This coupon has reached its usage limit.");
  }

  if (disc.isPersonal) {
    if (!userId || disc.assignedUser?.toString() !== userId.toString()) {
      throw new Error("This coupon is not valid for your account.");
    }
  }

  if (disc.applicableTo !== "all" && disc.applicableTo !== bookingMode) {
    const label = disc.applicableTo === "night_stay" ? "night stays" : "day-long visits";
    throw new Error(`This coupon is only valid for ${label}.`);
  }

  if (disc.minOrderAmount > 0 && orderTotal < disc.minOrderAmount) {
    throw new Error(
      `Minimum order of ৳${disc.minOrderAmount.toLocaleString()} required to use this coupon.`
    );
  }

  // Calculate the discount amount
  let discountAmount = 0;
  if (disc.discountType === "percentage") {
    discountAmount = Math.round((orderTotal * disc.discountValue) / 100);
    if (disc.maxDiscountAmount > 0) {
      discountAmount = Math.min(discountAmount, disc.maxDiscountAmount);
    }
  } else {
    discountAmount = disc.discountValue;
  }

  discountAmount = Math.min(discountAmount, orderTotal); // can't discount more than total

  return {
    success: true,
    id:             disc._id.toString(),
    name:           disc.name,
    discountType:   disc.discountType,
    discountValue:  disc.discountValue,
    discountAmount, // the actual BDT amount deducted
    code:           disc.code,
  };
}

// ─── Internal: Increment Usage Counter (call after booking confirmed) ─────────

export async function incrementCouponUsage(discountId) {
  await dbConnect();
  await Discount.findByIdAndUpdate(discountId, { $inc: { usedCount: 1 } });
}

// ─── Public: Get Active Offers (no code needed) ───────────────────────────────

export async function getActiveOffers(bookingMode = "all") {
  await dbConnect();
  const now = new Date();
  const query = {
    type: "offer",
    isActive: true,
    isPersonal: false,
    validFrom: { $lte: now },
    validTo:   { $gte: now },
    $or: [{ applicableTo: "all" }, { applicableTo: bookingMode }],
  };
  const offers = await Discount.find(query).sort({ discountValue: -1 }).lean();
  return JSON.parse(JSON.stringify(offers));
}
