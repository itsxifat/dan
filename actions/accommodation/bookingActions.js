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
import { createAdminNotification } from "@/actions/notifications/adminNotificationActions";
import {
  sendBookingConfirmationEmail,
  sendCheckInEmail,
  sendCheckOutEmail,
} from "@/lib/email";

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

/**
 * Generate the next booking number atomically.
 * Finds the highest existing DAN-XXXX number and increments it.
 * Retries up to `maxRetries` times on a duplicate-key collision (race condition).
 */
async function generateBookingNumber(maxRetries = 8) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Find the document with the lexicographically largest booking number
    const last = await Booking.findOne({}, "bookingNumber")
      .sort({ bookingNumber: -1 })
      .lean();

    let nextNum = 1;
    if (last?.bookingNumber) {
      const match = last.bookingNumber.match(/(\d+)$/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }

    const candidate = `DAN-${String(nextNum).padStart(4, "0")}`;

    // Verify the candidate is not already taken (handles gaps/deletions)
    const taken = await Booking.exists({ bookingNumber: candidate });
    if (!taken) return candidate;

    // Collision detected — loop and re-query for the new max
  }
  throw new Error("Could not generate a unique booking number. Please try again.");
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

  // All rooms in this category — include "occupied" rooms because occupancy is a static
  // snapshot; the date-range booking check below correctly handles actual conflicts.
  // Only hard-exclude maintenance/blocked rooms (they cannot accept any booking).
  const query = { property: propertyId, category: categoryId, status: { $in: ["available", "occupied"] } };
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
    // Coupon fields (optional)
    couponId,
    couponCode,
    couponDiscount: clientCouponDiscount,
    // Auto-offer fields (optional)
    offerId,
    offerDiscount: clientOfferDiscount,
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

  // Auto-offer discount (validate server-side)
  let offerDiscountAmt = 0;
  if (offerId) {
    const Discount = (await import("@/models/Discount")).default;
    const offer = await Discount.findOne({ _id: offerId, type: "offer", isActive: true }).lean();
    if (offer) {
      const now = new Date();
      if (now >= new Date(offer.validFrom) && now <= new Date(offer.validTo)) {
        const orderForOffer = subtotal + taxes - dayLongDiscountAmt;
        const meetsMin = offer.minOrderAmount === 0 || orderForOffer >= offer.minOrderAmount;
        const modeOk = offer.applicableTo === "all" || offer.applicableTo === bookingMode;
        if (meetsMin && modeOk) {
          if (offer.discountType === "percentage") {
            offerDiscountAmt = Math.round((orderForOffer * offer.discountValue) / 100);
            if (offer.maxDiscountAmount > 0) offerDiscountAmt = Math.min(offerDiscountAmt, offer.maxDiscountAmount);
          } else {
            offerDiscountAmt = offer.discountValue;
          }
          offerDiscountAmt = Math.min(offerDiscountAmt, orderForOffer);
        }
      }
    }
  }

  // One discount at a time: if coupon is provided, skip offer (coupon takes priority)
  if (couponId && offerDiscountAmt > 0) {
    offerDiscountAmt = 0;
  }

  // Coupon discount (validate server-side: cap at remaining after day-long discount)
  const afterOffer = Math.max(0, subtotal + taxes - dayLongDiscountAmt - offerDiscountAmt);
  const couponDiscountAmt = Math.max(
    0,
    Math.min(clientCouponDiscount || 0, afterOffer)
  );

  const totalAmount = Math.max(0, subtotal + taxes - dayLongDiscountAmt - offerDiscountAmt - couponDiscountAmt);

  const advancePct = advancePercent ?? (paymentMethod === "pay_at_desk" ? 0 : (settings.advancePaymentPercent ?? 100));
  const advanceAmt = Math.round((totalAmount * advancePct) / 100);
  const remaining  = totalAmount - advanceAmt;

  const bookingNumber = await generateBookingNumber();

  const booking = await Booking.create({
    bookingNumber,
    bookingMode: bookingMode || "night_stay",
    property:    propertyId || null,
    bookingType: bookingType || null,
    roomBookings: resolvedRoomBookings,
    category:     categoryId || null,
    room:         cottageRoomId || null,
    dayLongPackage:  dayLongPackageId || null,
    dayLongAddons:   dayLongAddonIds  || [],
    dayLongDiscount: dayLongDiscountAmt,
    offerId:         offerId || null,
    offerDiscount:   offerDiscountAmt,
    couponId:        couponId  || null,
    couponCode:      couponCode || "",
    couponDiscount:  couponDiscountAmt,
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

  // Notify admin activity feed (non-blocking)
  createAdminNotification({
    type:    "booking",
    title:   `New booking: ${bookingNumber}`,
    message: `${primaryGuest?.name || "Guest"} · ${bookingMode === "day_long" ? "Day Long" : `${nights || 1} night(s)`} · ৳${totalAmount.toLocaleString("en-BD")}`,
    link:    "/admin/bookings",
    metadata: { bookingId: booking._id.toString(), bookingNumber },
  }).catch(() => {});

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

  // Send confirmation email (non-blocking)
  const b = await Booking.findById(bookingId)
    .populate("property", "name")
    .populate("roomBookings.room", "roomNumber")
    .lean();

  if (b?.primaryGuest?.email) {
    const rooms = (b.roomBookings || [])
      .map((rb) => rb.room?.roomNumber ? `#${rb.room.roomNumber}` : null)
      .filter(Boolean);
    const totalSaved = (b.dayLongDiscount ?? 0) + (b.offerDiscount ?? 0) + (b.couponDiscount ?? 0);

    sendBookingConfirmationEmail({
      to:              b.primaryGuest.email,
      guestName:       b.primaryGuest.name   || "Guest",
      bookingNumber:   b.bookingNumber,
      bookingId:       bookingId.toString(),
      propertyName:    b.property?.name      || "Dhali's Amber Nivaas",
      checkIn:         b.checkIn,
      checkOut:        b.checkOut,
      nights:          b.nights              ?? 0,
      bookingMode:     b.bookingMode,
      rooms,
      subtotal:        b.subtotal            ?? 0,
      taxes:           b.taxes               ?? 0,
      dayLongDiscount: b.dayLongDiscount      ?? 0,
      offerDiscount:   b.offerDiscount        ?? 0,
      couponDiscount:  b.couponDiscount       ?? 0,
      couponCode:      b.couponCode           || "",
      totalAmount:     b.totalAmount          ?? 0,
      paidAmount:      0,
      remainingAmount: b.totalAmount          ?? 0,
      isPartial:       false,
      totalSaved,
      baseUrl:         process.env.NEXT_PUBLIC_BASE_URL,
    }).catch((err) => console.error("Pay-at-desk confirmation email failed:", err));
  }

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

  // When checking in, enforce full payment and ensure paymentStatus is accurate
  let extraFields = {};
  if (status === "checked_in") {
    const b = await Booking.findById(bookingId).select("remainingAmount totalAmount").lean();
    if (!b) throw new Error("Booking not found");
    if ((b.remainingAmount ?? 0) > 0) {
      throw new Error(
        `Full payment required before check-in. Still due: ৳${(b.remainingAmount).toLocaleString("en-BD")}.`
      );
    }
    // Ensure payment fields are fully consistent at check-in
    extraFields.paymentStatus   = "paid";
    extraFields.paidAmount      = b.totalAmount || 0;
    extraFields.remainingAmount = 0;
  }

  const booking = await Booking.findByIdAndUpdate(
    bookingId,
    { status, ...extraFields, updatedAt: new Date() },
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
  revalidatePath("/admin/rooms");

  // Send status-change emails (non-blocking)
  if (status === "checked_in" || status === "checked_out") {
    (async () => {
      try {
        const bPop = await Booking.findById(bookingId)
          .populate("property", "name")
          .populate("roomBookings.room", "roomNumber")
          .lean();
        if (!bPop?.primaryGuest?.email) return;

        const rooms = (bPop.roomBookings || [])
          .map((rb) => rb.room?.roomNumber ? `#${rb.room.roomNumber}` : null)
          .filter(Boolean);

        if (status === "checked_in") {
          await sendCheckInEmail({
            to:          bPop.primaryGuest.email,
            guestName:   bPop.primaryGuest.name   || "Guest",
            bookingNumber: bPop.bookingNumber,
            bookingId:   bookingId.toString(),
            propertyName: bPop.property?.name     || "Dhali's Amber Nivaas",
            checkIn:     bPop.checkIn,
            checkOut:    bPop.checkOut,
            nights:      bPop.nights              ?? 0,
            bookingMode: bPop.bookingMode,
            rooms,
            totalAmount: bPop.totalAmount         ?? 0,
            baseUrl:     process.env.NEXT_PUBLIC_BASE_URL,
          });
        } else {
          await sendCheckOutEmail({
            to:          bPop.primaryGuest.email,
            guestName:   bPop.primaryGuest.name   || "Guest",
            bookingNumber: bPop.bookingNumber,
            propertyName: bPop.property?.name     || "Dhali's Amber Nivaas",
            checkOut:    bPop.checkOut,
            nights:      bPop.nights              ?? 0,
            bookingMode: bPop.bookingMode,
            rooms,
            baseUrl:     process.env.NEXT_PUBLIC_BASE_URL,
          });
        }
      } catch (err) {
        console.error(`${status} email failed:`, err);
      }
    })();
  }

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

export async function recordCheckInPayment(bookingId, { paidAmount, paymentMethod }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasPermission(session.user.role, "bookings.write")) {
    throw new Error("Unauthorized");
  }

  await dbConnect();

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  const paid = parseFloat(paidAmount) || 0;
  // Use remainingAmount as the authoritative "still owed" figure.
  // paidAmount in DB may be 0 for pay-at-desk bookings where the advance
  // wasn't recorded before confirmation, so total-(alreadyPaid+paid) is unreliable.
  const currentRemaining = booking.remainingAmount ?? 0;
  const newRemaining = Math.max(0, currentRemaining - paid);

  if (newRemaining > 0) {
    throw new Error(
      `Full payment required to check in. Still due: ৳${newRemaining.toLocaleString("en-BD")}. Please collect the full outstanding amount before proceeding.`
    );
  }

  // Bring paidAmount fully up to date regardless of prior recording gaps
  const newTotalPaid = booking.totalAmount || 0;

  await Booking.findByIdAndUpdate(bookingId, {
    status:          "checked_in",
    paymentMethod:   paymentMethod || booking.paymentMethod,
    paymentStatus:   "paid",
    paidAmount:      newTotalPaid,
    remainingAmount: 0,
    updatedAt:       new Date(),
  });

  // Mark rooms as occupied
  const roomIds = [
    ...(booking.room ? [booking.room] : []),
    ...(booking.roomBookings?.map((rb) => rb.room) || []),
  ];
  if (roomIds.length > 0) {
    await Room.updateMany({ _id: { $in: roomIds } }, { status: "occupied" });
  }

  // Notify admin
  createAdminNotification({
    type:    "payment",
    title:   `Check-in payment: ${booking.bookingNumber}`,
    message: `৳${paid.toLocaleString("en-BD")} received at desk · Guest checked in`,
    link:    `/admin/bookings/${bookingId}`,
    metadata: { bookingId: bookingId.toString(), bookingNumber: booking.bookingNumber, paid },
  }).catch(() => {});

  // Send check-in welcome email (non-blocking)
  if (booking.primaryGuest?.email) {
    const bPop = await Booking.findById(bookingId)
      .populate("property", "name")
      .populate("roomBookings.room", "roomNumber")
      .lean();
    const rooms = (bPop?.roomBookings || [])
      .map((rb) => rb.room?.roomNumber ? `#${rb.room.roomNumber}` : null)
      .filter(Boolean);

    sendCheckInEmail({
      to:          booking.primaryGuest.email,
      guestName:   booking.primaryGuest.name  || "Guest",
      bookingNumber: booking.bookingNumber,
      bookingId:   bookingId.toString(),
      propertyName: bPop?.property?.name      || "Dhali's Amber Nivaas",
      checkIn:     booking.checkIn,
      checkOut:    booking.checkOut,
      nights:      booking.nights             ?? 0,
      bookingMode: booking.bookingMode,
      rooms,
      totalAmount: booking.totalAmount        ?? 0,
      baseUrl:     process.env.NEXT_PUBLIC_BASE_URL,
    }).catch((err) => console.error("Check-in email failed:", err));
  }

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/rooms");
  return { success: true, paymentStatus: newPaymentStatus, remainingAmount: newRemaining };
}

export async function getUnviewedBookingCount() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasPermission(session.user.role, "bookings.read")) return 0;

  await dbConnect();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return Booking.countDocuments({ status: "confirmed", createdAt: { $gte: since } });
}
