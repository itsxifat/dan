"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import Booking from "@/models/Booking";
import Room from "@/models/Room";
import Settings from "@/models/Settings";
import { hasPermission } from "@/lib/permissions";

/** Check availability and return pricing for a property/room+dates combo */
export async function checkAvailability({ propertyId, categoryId, roomId, checkIn, checkOut }) {
  await dbConnect();

  const checkInDate  = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

  if (nights < 1) throw new Error("Check-out must be after check-in.");

  if (roomId) {
    const conflict = await Booking.exists({
      room: roomId,
      status: { $nin: ["cancelled", "no_show"] },
      checkIn:  { $lt: checkOutDate },
      checkOut: { $gt: checkInDate },
    });
    return { available: !conflict, nights };
  }

  // Cottage
  const conflict = await Booking.exists({
    property: propertyId,
    bookingType: "cottage",
    status: { $nin: ["cancelled", "no_show"] },
    checkIn:  { $lt: checkOutDate },
    checkOut: { $gt: checkInDate },
  });
  return { available: !conflict, nights };
}

/** Creates a pending booking before payment */
export async function createPendingBooking(bookingData) {
  await dbConnect();

  const settings = await Settings.findOne().lean() || {};
  const {
    propertyId, categoryId, roomId, bookingType,
    checkIn, checkOut, nights, primaryGuest, guests,
    isCoupleBooking, coupleDocumentUrl, coupleDocMethod,
    nidUrl, nidMethod, specialRequests, basePrice, paymentMethod,
  } = bookingData;

  const taxPercent = settings.taxPercent ?? 0;
  const subtotal   = basePrice * nights;
  const taxes      = Math.round((subtotal * taxPercent) / 100);
  const totalAmount = subtotal + taxes;

  const bookingNumber = `DAN-${Date.now()}`;

  // Classify guests as adult/child
  const maxFreeChildAge = settings.maxFreeChildAge ?? 5;
  const classifiedGuests = guests.map((g) => ({
    ...g,
    type: g.age <= maxFreeChildAge ? "child" : "adult",
  }));

  const booking = await Booking.create({
    bookingNumber,
    property:  propertyId,
    category:  categoryId  || null,
    room:      roomId      || null,
    bookingType,
    checkIn:   new Date(checkIn),
    checkOut:  new Date(checkOut),
    nights,
    primaryGuest,
    guests: classifiedGuests,
    totalGuests: guests.length,
    isCoupleBooking: !!isCoupleBooking,
    coupleDocumentUrl: coupleDocumentUrl || "",
    coupleDocMethod:   coupleDocMethod   || "",
    nidUrl:            nidUrl            || "",
    nidMethod:         nidMethod         || "upload",
    specialRequests:   specialRequests   || "",
    basePrice,
    subtotal,
    taxes,
    totalAmount,
    paymentMethod,
    paymentStatus: "unpaid",
    status: "pending",
    bookedBy: null, // filled in if session exists
  });

  return {
    success: true,
    bookingId: booking._id.toString(),
    bookingNumber,
    totalAmount,
  };
}

export async function confirmPayAtDesk(bookingId) {
  await dbConnect();
  await Booking.findByIdAndUpdate(bookingId, {
    paymentMethod: "pay_at_desk",
    status: "confirmed",
    updatedAt: new Date(),
  });
  return { success: true };
}

export async function getAdminBookings({ page = 1, limit = 15, status = "", search = "", propertyId = "" } = {}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasPermission(session.user.role, "bookings.read")) {
    throw new Error("Unauthorized");
  }

  await dbConnect();

  const query = {};
  if (status) query.status = status;
  if (propertyId) query.property = propertyId;
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

  // If cancelled — free up room if it was set to occupied
  if (status === "cancelled" && booking?.room) {
    await Room.findByIdAndUpdate(booking.room, { status: "available" });
  }
  // If checked in — mark room as occupied
  if (status === "checked_in" && booking?.room) {
    await Room.findByIdAndUpdate(booking.room, { status: "occupied" });
  }
  // If checked out — mark room as available
  if (status === "checked_out" && booking?.room) {
    await Room.findByIdAndUpdate(booking.room, { status: "available" });
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
  // Count bookings created in last 24 hours with pending status
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return Booking.countDocuments({ status: "pending", createdAt: { $gte: since } });
}
