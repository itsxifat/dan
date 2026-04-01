"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import Booking from "@/models/Booking";
import Room from "@/models/Room";
import RoomCategory from "@/models/RoomCategory";
import Settings from "@/models/Settings";
import BookingLock from "@/models/BookingLock";
import { hasPermission } from "@/lib/permissions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Resolve the effective price for a room.
 * Priority: room.pricePerNight > variant.pricePerNight > category.pricePerNight
 */
function resolveNightPrice(room, category) {
  if (room.pricePerNight > 0) return room.pricePerNight;
  if (room.variantId && category?.variants?.length) {
    const v = category.variants.find(
      (x) => x._id.toString() === room.variantId.toString()
    );
    if (v?.pricePerNight > 0) return v.pricePerNight;
  }
  return category?.pricePerNight ?? 0;
}

function resolveDayPrice(room, category) {
  if (room.pricePerDay > 0) return room.pricePerDay;
  if (room.variantId && category?.variants?.length) {
    const v = category.variants.find(
      (x) => x._id.toString() === room.variantId.toString()
    );
    if (v?.pricePerDay > 0) return v.pricePerDay;
  }
  return category?.pricePerDay ?? 0;
}

// ─── Check Availability ───────────────────────────────────────────────────────

export async function checkAvailability({ roomId, propertyId, checkIn, checkOut, bookingMode }) {
  await dbConnect();

  const checkInDate  = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  if (checkOutDate <= checkInDate) throw new Error("Check-out must be after check-in.");

  const nights = bookingMode === "day_long"
    ? 0
    : Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

  if (roomId) {
    // "pending" bookings are payment-in-progress and not yet confirmed — exclude them.
    // The BookingLock handles blocking during the payment window instead.
    const booked = await Booking.exists({
      $or: [
        { room: roomId },
        { "roomBookings.room": roomId },
      ],
      status: { $nin: ["cancelled", "no_show", "pending"] },
      checkIn:  { $lt: checkOutDate },
      checkOut: { $gt: checkInDate },
    });

    // Check active locks (covers the payment window for pending bookings)
    const locked = await BookingLock.exists({
      roomId,
      checkIn:  { $lt: checkOutDate },
      checkOut: { $gt: checkInDate },
      expiresAt: { $gt: new Date() },
    });

    return { available: !booked && !locked, nights };
  }

  // Cottage — same rule: exclude pending
  const conflict = await Booking.exists({
    property: propertyId,
    bookingType: "cottage",
    status: { $nin: ["cancelled", "no_show", "pending"] },
    checkIn:  { $lt: checkOutDate },
    checkOut: { $gt: checkInDate },
  });
  return { available: !conflict, nights };
}

/**
 * Get available rooms for a property+category+dates combo,
 * filtered for day-long support if needed.
 */
export async function getAvailableRoomsForBooking({
  propertyId,
  categoryId,
  checkIn,
  checkOut,
  bookingMode = "night_stay",
}) {
  await dbConnect();

  const checkInDate  = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  const category = await RoomCategory.findById(categoryId).lean();
  if (!category) return [];

  // All rooms in this category
  const query = { property: propertyId, category: categoryId, status: "available" };
  const allRooms = await Room.find(query).lean();

  // Booked room IDs in this date range — exclude "pending" (payment not yet confirmed)
  const activeBookings = await Booking.find({
    $or: [
      { room: { $in: allRooms.map((r) => r._id) } },
      { "roomBookings.room": { $in: allRooms.map((r) => r._id) } },
    ],
    status: { $nin: ["cancelled", "no_show", "pending"] },
    checkIn:  { $lt: checkOutDate },
    checkOut: { $gt: checkInDate },
  }).select("room roomBookings").lean();

  const bookedRoomIds = new Set();
  for (const b of activeBookings) {
    if (b.room) bookedRoomIds.add(b.room.toString());
    for (const rb of (b.roomBookings || [])) {
      if (rb.room) bookedRoomIds.add(rb.room.toString());
    }
  }

  // Locked room IDs
  const now = new Date();
  const locks = await BookingLock.find({
    roomId: { $in: allRooms.map((r) => r._id) },
    checkIn:  { $lt: checkOutDate },
    checkOut: { $gt: checkInDate },
    expiresAt: { $gt: now },
  }).lean();
  const lockedRoomIds = new Set(locks.map((l) => l.roomId.toString()));

  const available = allRooms.filter((room) => {
    if (bookedRoomIds.has(room._id.toString())) return false;
    if (lockedRoomIds.has(room._id.toString())) return false;

    // Day-long filter
    if (bookingMode === "day_long") {
      // room.dayLongSupported: null = inherit from category, true/false = override
      const roomDayLong = room.dayLongSupported === null || room.dayLongSupported === undefined
        ? category.supportsDayLong
        : room.dayLongSupported;
      if (!roomDayLong) return false;
    }

    return true;
  });

  // Attach resolved price + per-room variant capacity / bed type
  return available.map((room) => {
    // Find this room's variant (if it has one)
    const variant = room.variantId && category.variants?.length
      ? category.variants.find((v) => v._id.toString() === room.variantId.toString())
      : null;

    // Capacity: variant-level overrides category-level
    const maxAdults   = (variant?.maxAdults   > 0 ? variant.maxAdults   : null) ?? category.maxAdults   ?? 2;
    const maxChildren = (variant?.maxChildren >= 0 ? variant.maxChildren : null) ?? category.maxChildren ?? 0;

    // Bed type: room-level > variant-level > category-level
    const bedType = room.bedType || variant?.bedType || category.bedType || "";

    return {
      ...room,
      _id:       room._id.toString(),
      property:  room.property.toString(),
      category:  room.category.toString(),
      variantId: room.variantId ? room.variantId.toString() : null,
      resolvedNightPrice: resolveNightPrice(room, category),
      resolvedDayPrice:   resolveDayPrice(room, category),
      maxAdults,
      maxChildren,
      categoryName: category.name,
      variantName:  variant?.name ?? null,
      bedType,
      hasPriceOverride: room.pricePerNight > 0 || room.pricePerDay > 0 || (variant?.pricePerNight > 0) || (variant?.pricePerDay > 0),
    };
  });
}

// ─── Create Pending Booking ───────────────────────────────────────────────────

export async function createPendingBooking(bookingData) {
  await dbConnect();

  const session  = await getServerSession(authOptions);
  const settings = await Settings.findOne().lean() || {};

  const {
    bookingMode,        // "night_stay" | "day_long"
    propertyId,
    bookingType,        // "room" | "cottage"
    roomBookings,       // [{ roomId, categoryId, guests: [...] }]
    cottageRoomId,      // for cottage bookings
    categoryId,         // for cottage
    dayLongPackageId,
    dayLongAddonIds,
    dayLongDiscount: clientDiscount,
    checkIn,
    checkOut,
    nights,
    primaryGuest,
    nidUrl,
    nidMethod,
    specialRequests,
    paymentMethod,
    advancePercent,
  } = bookingData;

  const taxPercent   = settings.taxPercent ?? 0;
  const maxFreeChildAge = settings.maxFreeChildAge ?? 5;

  // ── Resolve pricing and guests ──────────────────────────────────────────────
  let basePrice = 0;
  const resolvedRoomBookings = [];
  const allGuestsList = [];

  if (bookingType === "room" && roomBookings?.length > 0) {
    for (const rb of roomBookings) {
      const room     = await Room.findById(rb.roomId).lean();
      const category = await RoomCategory.findById(rb.categoryId).lean();
      if (!room || !category) throw new Error("Invalid room or category.");

      const nightPrice = resolveNightPrice(room, category);
      const dayPrice   = resolveDayPrice(room, category);
      const price      = bookingMode === "day_long" ? dayPrice : nightPrice;
      basePrice += price;

      const classifiedGuests = (rb.guests || []).map((g) => ({
        ...g,
        type: g.age <= maxFreeChildAge ? "child" : "adult",
      }));

      // Detect couple room
      const hasOppositeGender = (() => {
        const adults = classifiedGuests.filter((g) => g.type === "adult");
        const hasMale   = adults.some((g) => g.gender === "male");
        const hasFemale = adults.some((g) => g.gender === "female");
        return hasMale && hasFemale;
      })();

      resolvedRoomBookings.push({
        room:              rb.roomId,
        category:          rb.categoryId,
        pricePerNight:     nightPrice,
        pricePerDay:       dayPrice,
        guests:            classifiedGuests,
        isCoupleRoom:      hasOppositeGender && (settings.requireCoupleDoc ?? true),
        coupleDocumentUrl: rb.coupleDocumentUrl || "",
        coupleDocMethod:   rb.coupleDocMethod   || "",
      });

      allGuestsList.push(...classifiedGuests);
    }
  }

  // Cottage price (backwards compat)
  if (bookingType === "cottage") {
    const cottageProp = await (await import("@/models/Property")).default
      .findById(propertyId).lean();
    basePrice = cottageProp?.pricePerNight ?? 0;
  }

  // Day-long: entry fee + add-ons (all per-day, not multiplied by nights)
  let dayLongSvcPrice = 0;
  let dayLongDiscountAmt = 0;
  if (bookingMode === "day_long") {
    const DayLongPackage = (await import("@/models/DayLongPackage")).default;
    if (dayLongPackageId) {
      const entry = await DayLongPackage.findById(dayLongPackageId).lean();
      dayLongSvcPrice += entry?.price ?? 0;
    }
    if (dayLongAddonIds?.length) {
      const addons = await DayLongPackage.find({ _id: { $in: dayLongAddonIds } }).lean();
      for (const a of addons) dayLongSvcPrice += a.price ?? 0;
      // Trust the client-computed discount (already validated against addon rules)
      dayLongDiscountAmt = Math.max(0, clientDiscount || 0);
    }
  }

  const multiplier  = bookingMode === "day_long" ? 1 : (nights || 1);
  const subtotal    = basePrice * multiplier + dayLongSvcPrice;
  const taxes       = Math.round((subtotal * taxPercent) / 100);
  const totalAmount = Math.max(0, subtotal + taxes - dayLongDiscountAmt);

  const advancePct = advancePercent ?? (paymentMethod === "pay_at_desk" ? 0 : (settings.advancePaymentPercent ?? 100));
  const advanceAmt = Math.round((totalAmount * advancePct) / 100);
  const remaining  = totalAmount - advanceAmt;

  const bookingNumber = `DAN-${Date.now()}`;

  const booking = await Booking.create({
    bookingNumber,
    bookingMode: bookingMode || "night_stay",
    property:    propertyId,
    bookingType,
    roomBookings: resolvedRoomBookings,
    category:     categoryId || null,
    room:         cottageRoomId || null,
    dayLongPackage:  dayLongPackageId || null,
    dayLongAddons:   dayLongAddonIds  || [],
    dayLongDiscount: dayLongDiscountAmt,
    checkIn:   new Date(checkIn),
    checkOut:  new Date(checkOut),
    nights:    nights ?? 0,
    primaryGuest,
    allGuests:   allGuestsList,
    totalGuests: allGuestsList.length,
    nidUrl:       nidUrl    || "",
    nidMethod:    nidMethod || "upload",
    specialRequests: specialRequests || "",
    basePrice,
    subtotal,
    taxes,
    totalAmount,
    advancePercent: advancePct,
    advanceAmount:  advanceAmt,
    paidAmount:     0,
    remainingAmount: remaining,
    paymentMethod,
    paymentStatus: "unpaid",
    status:    "pending",
    bookedBy:  session?.user?.id || null,
  });

  return {
    success: true,
    bookingId:     booking._id.toString(),
    bookingNumber,
    totalAmount,
    advanceAmount: advanceAmt,
    remainingAmount: remaining,
  };
}

// ─── Admin: Confirm Pay-at-Desk ───────────────────────────────────────────────

export async function confirmPayAtDesk(bookingId) {
  await dbConnect();
  await Booking.findByIdAndUpdate(bookingId, {
    paymentMethod: "pay_at_desk",
    status: "confirmed",
    updatedAt: new Date(),
  });
  return { success: true };
}

// ─── Admin: List Bookings ─────────────────────────────────────────────────────

export async function getAdminBookings({ page = 1, limit = 15, status = "", search = "", propertyId = "", bookingMode = "" } = {}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasPermission(session.user.role, "bookings.read")) {
    throw new Error("Unauthorized");
  }

  await dbConnect();

  const query = {};
  // Never show unconfirmed payment-pending bookings in admin list
  if (status) {
    query.status = status;
  } else {
    query.status = { $ne: "pending" };
  }
  if (propertyId)  query.property = propertyId;
  if (bookingMode) query.bookingMode = bookingMode;
  if (search) query.$or = [
    { bookingNumber: { $regex: search, $options: "i" } },
    { "primaryGuest.name":  { $regex: search, $options: "i" } },
    { "primaryGuest.email": { $regex: search, $options: "i" } },
  ];

  const skip = (page - 1) * limit;
  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("property", "name type")
      .populate("category", "name")
      .populate("room", "roomNumber floor")
      .populate("roomBookings.room", "roomNumber floor")
      .lean(),
    Booking.countDocuments(query),
  ]);

  return {
    bookings: JSON.parse(JSON.stringify(bookings)),
    total,
    pages: Math.ceil(total / limit) || 1,
    page,
  };
}

export async function getBookingById(bookingId) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasPermission(session.user.role, "bookings.read")) {
    throw new Error("Unauthorized");
  }

  await dbConnect();
  const booking = await Booking.findById(bookingId)
    .populate("property", "name type location")
    .populate("category", "name pricePerNight bedType")
    .populate("room", "roomNumber floor")
    .populate("roomBookings.room", "roomNumber floor")
    .populate("roomBookings.category", "name")
    .lean();

  return booking ? JSON.parse(JSON.stringify(booking)) : null;
}

export async function updateBookingStatus(bookingId, status) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasPermission(session.user.role, "bookings.write")) {
    throw new Error("Unauthorized");
  }

  const STATUSES = ["pending", "confirmed", "checked_in", "checked_out", "cancelled", "no_show"];
  if (!STATUSES.includes(status)) throw new Error("Invalid status");

  await dbConnect();

  const booking = await Booking.findByIdAndUpdate(
    bookingId,
    { status, updatedAt: new Date() },
    { returnDocument: "after" }
  );

  const roomIds = [
    ...(booking?.room ? [booking.room] : []),
    ...(booking?.roomBookings?.map((rb) => rb.room) || []),
  ];

  if (roomIds.length > 0) {
    if (status === "cancelled") {
      await Room.updateMany({ _id: { $in: roomIds } }, { status: "available" });
    }
    if (status === "checked_in") {
      await Room.updateMany({ _id: { $in: roomIds } }, { status: "occupied" });
    }
    if (status === "checked_out") {
      await Room.updateMany({ _id: { $in: roomIds } }, { status: "available" });
    }
  }

  revalidatePath("/admin/bookings");
  return { success: true };
}

export async function addAdminNote(bookingId, note) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasPermission(session.user.role, "bookings.write")) {
    throw new Error("Unauthorized");
  }

  await dbConnect();
  await Booking.findByIdAndUpdate(bookingId, { adminNotes: note, updatedAt: new Date() });
  revalidatePath(`/admin/bookings/${bookingId}`);
  return { success: true };
}

export async function getUnviewedBookingCount() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasPermission(session.user.role, "bookings.read")) return 0;

  await dbConnect();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return Booking.countDocuments({ status: "confirmed", createdAt: { $gte: since } });
}
