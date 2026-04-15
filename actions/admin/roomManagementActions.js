"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import Room from "@/models/Room";
import RoomCategory from "@/models/RoomCategory";
import Property from "@/models/Property";
import Booking from "@/models/Booking";
import RoomLog from "@/models/RoomLog";
import OfflineBooking from "@/models/OfflineBooking";
import { hasPermission } from "@/lib/permissions";

// ─── Auth helpers ─────────────────────────────────────────────────────────────

async function requireRead() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !hasPermission(session.user.role, "bookings.read")) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

async function requireWrite() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !hasPermission(session.user.role, "bookings.write")) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

// ─── Internal: append to room log ────────────────────────────────────────────

async function logEvent({ roomId, propertyId, type, message, performedBy, performedByName, booking, offlineBooking, meta }) {
  try {
    await RoomLog.create({
      room: roomId,
      property: propertyId,
      type,
      message,
      performedBy,
      performedByName,
      booking,
      offlineBooking,
      meta,
    });
  } catch (_) {
    // Log failures are non-fatal
  }
}

// ─── 1. Overview: all rooms with live status ─────────────────────────────────

export async function getRoomsOverview({ propertyId, status = "", floor = "", block = "", categoryId = "" } = {}) {
  await requireRead();
  await dbConnect();

  const filter = {};
  if (propertyId)  filter.property  = propertyId;
  if (status)      filter.status    = status;
  if (floor !== "") filter.floor    = Number(floor);
  if (block)       filter.block     = block;
  if (categoryId)  filter.category  = categoryId;

  const rooms = await Room.find(filter)
    .populate("property",  "name slug type")
    .populate("category",  "name slug pricePerNight bedType")
    .sort({ floor: 1, roomNumber: 1 })
    .lean();

  if (!rooms.length) return JSON.parse(JSON.stringify(rooms));

  const roomIds = rooms.map((r) => r._id);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Active online bookings for these rooms
  const activeBookings = await Booking.find({
    "roomBookings.room": { $in: roomIds },
    status: { $in: ["confirmed", "checked_in"] },
  })
    .select("bookingNumber status checkIn checkOut primaryGuest roomBookings totalAmount paidAmount")
    .lean();

  // Today's movements (online)
  // Only "confirmed" = not yet arrived; "checked_in" with today checkIn = already arrived
  const todayCheckIns = await Booking.find({
    "roomBookings.room": { $in: roomIds },
    checkIn: { $gte: today, $lt: tomorrow },
    status: "confirmed",
  }).select("roomBookings primaryGuest checkIn checkOut bookingNumber status").lean();

  const todayCheckedIn = await Booking.find({
    "roomBookings.room": { $in: roomIds },
    checkIn: { $gte: today, $lt: tomorrow },
    status: "checked_in",
  }).select("roomBookings primaryGuest checkIn checkOut bookingNumber status").lean();

  const todayCheckOuts = await Booking.find({
    "roomBookings.room": { $in: roomIds },
    checkOut: { $gte: today, $lt: tomorrow },
    status: { $in: ["confirmed", "checked_in"] },
  }).select("roomBookings primaryGuest checkIn checkOut bookingNumber status").lean();

  // Active offline bookings
  const activeOffline = await OfflineBooking.find({
    room: { $in: roomIds },
    status: { $in: ["confirmed", "checked_in", "reserved"] },
  })
    .select("referenceNumber status checkIn checkOut primaryGuest paidAmount finalAmount remainingAmount hasConflict nights")
    .lean();

  // Offline today's movements
  const todayOfflineIn = await OfflineBooking.find({
    room: { $in: roomIds },
    checkIn: { $gte: today, $lt: tomorrow },
    status: { $in: ["confirmed", "reserved"] },
  }).select("referenceNumber primaryGuest checkIn checkOut room status").lean();

  const todayOfflineOut = await OfflineBooking.find({
    room: { $in: roomIds },
    checkOut: { $gte: today, $lt: tomorrow },
    status: { $in: ["checked_in"] },
  }).select("referenceNumber primaryGuest checkIn checkOut room status").lean();

  // Build lookup maps
  const bookingByRoom = {};
  for (const b of activeBookings) {
    for (const rb of b.roomBookings || []) {
      const rId = rb.room?.toString();
      if (rId) bookingByRoom[rId] = { ...b, _roomBooking: rb };
    }
  }

  const offlineByRoom = {};
  for (const ob of activeOffline) {
    const rId = ob.room?.toString();
    if (rId) offlineByRoom[rId] = ob;
  }

  const checkInsByRoom = {};
  for (const b of todayCheckIns) {
    for (const rb of b.roomBookings || []) {
      const rId = rb.room?.toString();
      if (rId) checkInsByRoom[rId] = b;
    }
  }
  for (const ob of todayOfflineIn) {
    const rId = ob.room?.toString();
    if (rId) checkInsByRoom[rId] = { ...ob, _isOffline: true };
  }

  // Rooms where guest already checked in today
  const checkedInTodayByRoom = {};
  for (const b of todayCheckedIn) {
    for (const rb of b.roomBookings || []) {
      const rId = rb.room?.toString();
      if (rId) checkedInTodayByRoom[rId] = b;
    }
  }

  const checkOutsByRoom = {};
  for (const b of todayCheckOuts) {
    for (const rb of b.roomBookings || []) {
      const rId = rb.room?.toString();
      if (rId) checkOutsByRoom[rId] = b;
    }
  }
  for (const ob of todayOfflineOut) {
    const rId = ob.room?.toString();
    if (rId) checkOutsByRoom[rId] = { ...ob, _isOffline: true };
  }

  const enriched = rooms.map((room) => {
    const rId = room._id.toString();
    return {
      ...room,
      _activeBooking:   bookingByRoom[rId]       || null,
      _activeOffline:   offlineByRoom[rId]        || null,
      _todayCheckIn:    checkInsByRoom[rId]        || null,
      _checkedInToday:  checkedInTodayByRoom[rId]  || null,
      _todayCheckOut:   checkOutsByRoom[rId]       || null,
      _hasConflict:     !!(bookingByRoom[rId] && offlineByRoom[rId]),
    };
  });

  return JSON.parse(JSON.stringify(enriched));
}

// ─── 2. Property stats for dashboard ─────────────────────────────────────────

export async function getPropertyRoomStats(propertyId) {
  await requireRead();
  await dbConnect();

  const filter = propertyId ? { property: propertyId } : {};

  const [rooms, allProperties] = await Promise.all([
    Room.find(filter).select("status property floor block").lean(),
    propertyId ? [] : Property.find({ isActive: true }).select("name slug type").lean(),
  ]);

  const stats = {
    total:       rooms.length,
    available:   rooms.filter((r) => r.status === "available").length,
    occupied:    rooms.filter((r) => r.status === "occupied").length,
    maintenance: rooms.filter((r) => r.status === "maintenance").length,
    blocked:     rooms.filter((r) => r.status === "blocked").length,
  };
  stats.occupancyRate = stats.total
    ? Math.round((stats.occupied / stats.total) * 100)
    : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const roomIds = rooms.map((r) => r._id);

  const [onlineIn, onlineOut, offlineIn, offlineOut, conflicts] = await Promise.all([
    Booking.countDocuments({
      "roomBookings.room": { $in: roomIds },
      checkIn: { $gte: today, $lt: tomorrow },
      status: "confirmed",   // only guests not yet arrived
    }),
    Booking.countDocuments({
      "roomBookings.room": { $in: roomIds },
      checkOut: { $gte: today, $lt: tomorrow },
      status: { $in: ["confirmed", "checked_in"] },
    }),
    OfflineBooking.countDocuments({
      room: { $in: roomIds },
      checkIn: { $gte: today, $lt: tomorrow },
      status: { $in: ["confirmed", "reserved"] },
    }),
    OfflineBooking.countDocuments({
      room: { $in: roomIds },
      checkOut: { $gte: today, $lt: tomorrow },
      status: { $in: ["checked_in"] },
    }),
    OfflineBooking.countDocuments({
      room: { $in: roomIds },
      hasConflict: true,
      status: { $nin: ["cancelled", "checked_out"] },
    }),
  ]);

  return JSON.parse(JSON.stringify({
    ...stats,
    todayCheckIns:   onlineIn + offlineIn,
    todayCheckOuts:  onlineOut + offlineOut,
    activeConflicts: conflicts,
    properties:      allProperties,
  }));
}

// ─── 3. Today's movements ─────────────────────────────────────────────────────

export async function getTodayMovements(propertyId) {
  await requireRead();
  await dbConnect();

  const filter = propertyId ? { property: propertyId } : {};
  const rooms = await Room.find(filter).select("_id roomNumber floor block").lean();
  const roomIds = rooms.map((r) => r._id);

  const roomMap = {};
  for (const r of rooms) roomMap[r._id.toString()] = r;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [onlineIn, onlineOut, offlineIn, offlineOut] = await Promise.all([
    Booking.find({
      "roomBookings.room": { $in: roomIds },
      checkIn: { $gte: today, $lt: tomorrow },
      status: "confirmed",   // only guests not yet arrived; checked_in guests are already here
    }).select("bookingNumber status checkIn checkOut primaryGuest roomBookings totalAmount paidAmount").lean(),

    Booking.find({
      "roomBookings.room": { $in: roomIds },
      checkOut: { $gte: today, $lt: tomorrow },
      status: { $in: ["confirmed", "checked_in"] },
    }).select("bookingNumber status checkIn checkOut primaryGuest roomBookings totalAmount paidAmount").lean(),

    OfflineBooking.find({
      room: { $in: roomIds },
      checkIn: { $gte: today, $lt: tomorrow },
      status: { $in: ["confirmed", "reserved"] },
    }).populate("room", "roomNumber floor block").lean(),

    OfflineBooking.find({
      room: { $in: roomIds },
      checkOut: { $gte: today, $lt: tomorrow },
      status: { $in: ["checked_in"] },
    }).populate("room", "roomNumber floor block").lean(),
  ]);

  // Flatten online bookings into per-room rows
  function flattenOnline(bookings, movementType) {
    const rows = [];
    for (const b of bookings) {
      for (const rb of b.roomBookings || []) {
        const room = roomMap[rb.room?.toString()];
        if (!room) continue;
        rows.push({
          _id: `${b._id}-${rb.room}`,
          bookingNumber: b.bookingNumber,
          status: b.status,
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          guest: b.primaryGuest,
          room,
          movementType,
          source: "online",
          totalAmount: b.totalAmount,
          paidAmount: b.paidAmount,
        });
      }
    }
    return rows;
  }

  function flattenOffline(bookings, movementType) {
    return bookings.map((ob) => ({
      _id: ob._id,
      referenceNumber: ob.referenceNumber,
      status: ob.status,
      checkIn: ob.checkIn,
      checkOut: ob.checkOut,
      guest: ob.primaryGuest,
      room: ob.room,
      movementType,
      source: "offline",
      finalAmount: ob.finalAmount,
      paidAmount: ob.paidAmount,
      remainingAmount: ob.remainingAmount,
    }));
  }

  return JSON.parse(JSON.stringify({
    arrivals:   [...flattenOnline(onlineIn, "arrival"),   ...flattenOffline(offlineIn, "arrival")],
    departures: [...flattenOnline(onlineOut, "departure"), ...flattenOffline(offlineOut, "departure")],
  }));
}

// ─── 4. Single room full detail ───────────────────────────────────────────────

export async function getRoomFullDetail(roomId) {
  await requireRead();
  await dbConnect();

  const room = await Room.findById(roomId)
    .populate("category", "name slug pricePerNight bedType amenities maxAdults maxChildren variants")
    .populate("property", "name slug type location checkInTime checkOutTime")
    .lean();

  if (!room) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Current / active booking (online)
  const currentOnline = await Booking.findOne({
    "roomBookings.room": roomId,
    status: { $in: ["checked_in", "confirmed"] },
    checkIn: { $lte: new Date() },
    checkOut: { $gte: today },
  })
    .select("bookingNumber status checkIn checkOut primaryGuest allGuests totalAmount paidAmount remainingAmount roomBookings paymentStatus paymentMethod")
    .lean();

  // Current / active offline booking
  const currentOffline = await OfflineBooking.findOne({
    room: roomId,
    status: { $in: ["checked_in", "confirmed", "reserved"] },
    checkIn: { $lte: new Date() },
    checkOut: { $gte: today },
  }).lean();

  // Next upcoming (online)
  const nextOnline = await Booking.findOne({
    "roomBookings.room": roomId,
    status: { $in: ["confirmed"] },
    checkIn: { $gt: new Date() },
  })
    .sort({ checkIn: 1 })
    .select("bookingNumber status checkIn checkOut primaryGuest totalAmount")
    .lean();

  // Next upcoming (offline)
  const nextOffline = await OfflineBooking.findOne({
    room: roomId,
    status: { $in: ["confirmed", "reserved"] },
    checkIn: { $gt: new Date() },
  })
    .sort({ checkIn: 1 })
    .select("referenceNumber status checkIn checkOut primaryGuest finalAmount")
    .lean();

  return JSON.parse(JSON.stringify({
    room,
    currentOnline,
    currentOffline,
    nextOnline,
    nextOffline,
    hasConflict: !!(currentOnline && currentOffline),
  }));
}

// ─── 5. Room booking history (online + offline) ───────────────────────────────

export async function getRoomHistory(roomId, { page = 1, limit = 20 } = {}) {
  await requireRead();
  await dbConnect();

  const skip = (page - 1) * limit;

  const [onlineBookings, offlineBookings] = await Promise.all([
    Booking.find({
      "roomBookings.room": roomId,
      status: { $nin: ["pending"] },
    })
      .select("bookingNumber status checkIn checkOut primaryGuest totalAmount paidAmount paymentStatus nights bookingMode createdAt")
      .sort({ checkIn: -1 })
      .lean(),

    OfflineBooking.find({ room: roomId })
      .select("referenceNumber status checkIn checkOut primaryGuest finalAmount paidAmount paymentStatus nights createdAt createdByName")
      .sort({ checkIn: -1 })
      .lean(),
  ]);

  // Merge and sort
  const merged = [
    ...onlineBookings.map((b) => ({ ...b, _source: "online" })),
    ...offlineBookings.map((b) => ({ ...b, _source: "offline" })),
  ].sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn));

  const total = merged.length;
  const paginated = merged.slice(skip, skip + limit);

  return JSON.parse(JSON.stringify({ history: paginated, total, pages: Math.ceil(total / limit) }));
}

// ─── 6. Room log ──────────────────────────────────────────────────────────────

export async function getRoomLog(roomId, { page = 1, limit = 30 } = {}) {
  await requireRead();
  await dbConnect();

  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    RoomLog.find({ room: roomId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    RoomLog.countDocuments({ room: roomId }),
  ]);

  return JSON.parse(JSON.stringify({ logs, total, pages: Math.ceil(total / limit) }));
}

// ─── 7. Offline bookings list for a room ─────────────────────────────────────

export async function getOfflineBookingsByRoom(roomId) {
  await requireRead();
  await dbConnect();

  const bookings = await OfflineBooking.find({ room: roomId })
    .sort({ checkIn: -1 })
    .lean();

  return JSON.parse(JSON.stringify(bookings));
}

// ─── 8. Conflict detection across property ───────────────────────────────────

export async function getConflicts(propertyId) {
  await requireRead();
  await dbConnect();

  const filter = propertyId ? { property: propertyId } : {};
  const rooms  = await Room.find(filter).select("_id roomNumber floor block property").lean();
  const roomIds = rooms.map((r) => r._id);
  const roomMap = {};
  for (const r of rooms) roomMap[r._id.toString()] = r;

  // Find all active offline bookings that have a conflict flag
  const conflicted = await OfflineBooking.find({
    room: { $in: roomIds },
    hasConflict: true,
    status: { $nin: ["cancelled", "checked_out"] },
  })
    .populate("room", "roomNumber floor block")
    .lean();

  // Also detect fresh conflicts by comparing date ranges
  const activeOffline = await OfflineBooking.find({
    room: { $in: roomIds },
    status: { $nin: ["cancelled", "checked_out", "no_show"] },
  }).select("room checkIn checkOut primaryGuest referenceNumber status hasConflict").lean();

  const activeOnline = await Booking.find({
    "roomBookings.room": { $in: roomIds },
    status: { $nin: ["cancelled", "pending", "no_show"] },
  }).select("roomBookings checkIn checkOut primaryGuest bookingNumber status").lean();

  // Build fresh conflict list
  const freshConflicts = [];
  for (const offline of activeOffline) {
    const rId = offline.room.toString();
    const oIn  = new Date(offline.checkIn);
    const oOut = new Date(offline.checkOut);

    for (const online of activeOnline) {
      const conflictsInRoom = (online.roomBookings || []).some(
        (rb) => rb.room?.toString() === rId
      );
      if (!conflictsInRoom) continue;

      const bIn  = new Date(online.checkIn);
      const bOut = new Date(online.checkOut);

      // Overlap: not (bOut <= oIn || bIn >= oOut)
      const overlaps = !(bOut <= oIn || bIn >= oOut);
      if (overlaps) {
        freshConflicts.push({
          room:           roomMap[rId],
          offlineBooking: offline,
          onlineBooking:  online,
        });
      }
    }
  }

  return JSON.parse(JSON.stringify({ conflicted, freshConflicts }));
}

// ─── 9. Change room status ────────────────────────────────────────────────────

export async function changeRoomStatus(roomId, newStatus, reason = "") {
  const user = await requireWrite();
  await dbConnect();

  const room = await Room.findById(roomId).select("status property roomNumber");
  if (!room) throw new Error("Room not found");

  const prevStatus = room.status;
  room.status = newStatus;
  await room.save();

  await logEvent({
    roomId,
    propertyId: room.property,
    type: "status_change",
    message: `Status changed from "${prevStatus}" to "${newStatus}"${reason ? `: ${reason}` : ""}`,
    performedBy: user.id,
    performedByName: user.name,
    meta: { prevStatus, newStatus, reason },
  });

  revalidatePath("/admin/rooms");
  revalidatePath(`/admin/rooms/${roomId}`);
  return { success: true };
}

// ─── 10. Add note to room log ─────────────────────────────────────────────────

export async function addRoomNote(roomId, note) {
  const user = await requireWrite();
  await dbConnect();

  const room = await Room.findById(roomId).select("property roomNumber");
  if (!room) throw new Error("Room not found");

  await logEvent({
    roomId,
    propertyId: room.property,
    type: "note",
    message: note,
    performedBy: user.id,
    performedByName: user.name,
  });

  // Also persist in room.notes
  await Room.findByIdAndUpdate(roomId, { notes: note });

  revalidatePath(`/admin/rooms/${roomId}`);
  return { success: true };
}

// ─── 11. Create offline booking ───────────────────────────────────────────────

export async function createOfflineBooking(data) {
  const user = await requireWrite();
  await dbConnect();

  const room = await Room.findById(data.roomId).select("property category roomNumber status").lean();
  if (!room) throw new Error("Room not found");

  const checkIn  = new Date(data.checkIn);
  const checkOut = new Date(data.checkOut);
  if (checkOut <= checkIn) throw new Error("Check-out must be after check-in");

  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

  // Conflict check: active offline bookings in this room for overlapping dates
  const offlineConflict = await OfflineBooking.findOne({
    room: data.roomId,
    status: { $nin: ["cancelled", "checked_out", "no_show"] },
    $nor: [{ checkOut: { $lte: checkIn } }, { checkIn: { $gte: checkOut } }],
  });

  // Conflict check: confirmed/checked_in online bookings
  const onlineConflict = await Booking.findOne({
    "roomBookings.room": data.roomId,
    status: { $nin: ["cancelled", "pending", "no_show"] },
    $nor: [{ checkOut: { $lte: checkIn } }, { checkIn: { $gte: checkOut } }],
  });

  const totalAmount   = nights * data.pricePerNight;
  const discountAmount = data.discountAmount || 0;
  const finalAmount   = totalAmount - discountAmount;
  const paidAmount    = data.paidAmount || 0;

  const ob = await OfflineBooking.create({
    property:     room.property,
    room:         data.roomId,
    category:     room.category,
    checkIn,
    checkOut,
    nights,
    primaryGuest: data.primaryGuest,
    allGuests:    data.allGuests || [],
    totalGuests:  data.totalGuests || 1,
    status:       data.status || "confirmed",
    pricePerNight: data.pricePerNight,
    totalAmount,
    discountAmount,
    finalAmount,
    paidAmount,
    payments: paidAmount > 0 ? [{
      amount: paidAmount,
      method: data.paymentMethod || "cash",
      note: "Initial payment at booking",
      receivedBy: user.id,
      receivedByName: user.name,
    }] : [],
    specialRequests: data.specialRequests,
    adminNotes:      data.adminNotes,
    internalNotes:   data.internalNotes,
    hasConflict:     !!(offlineConflict || onlineConflict),
    conflictBookingId: onlineConflict?._id || undefined,
    conflictNote: offlineConflict
      ? `Conflicts with offline booking ${offlineConflict.referenceNumber}`
      : onlineConflict
        ? `Conflicts with online booking ${onlineConflict.bookingNumber}`
        : undefined,
    createdBy:     user.id,
    createdByName: user.name,
  });

  await logEvent({
    roomId: data.roomId,
    propertyId: room.property,
    type: "offline_booking_created",
    message: `Offline booking ${ob.referenceNumber} created for ${data.primaryGuest.name} (${checkIn.toDateString()} – ${checkOut.toDateString()})`,
    performedBy: user.id,
    performedByName: user.name,
    offlineBooking: ob._id,
    meta: { nights, totalAmount, finalAmount, paidAmount, hasConflict: ob.hasConflict },
  });

  if (ob.hasConflict) {
    await logEvent({
      roomId: data.roomId,
      propertyId: room.property,
      type: "conflict_detected",
      message: ob.conflictNote || "Booking conflict detected",
      performedBy: user.id,
      performedByName: user.name,
      offlineBooking: ob._id,
      booking: onlineConflict?._id,
    });
  }

  revalidatePath("/admin/rooms");
  revalidatePath(`/admin/rooms/${data.roomId}`);
  return JSON.parse(JSON.stringify({ success: true, offlineBooking: ob }));
}

// ─── 12. Update offline booking ───────────────────────────────────────────────

export async function updateOfflineBooking(offlineBookingId, data) {
  const user = await requireWrite();
  await dbConnect();

  const ob = await OfflineBooking.findById(offlineBookingId);
  if (!ob) throw new Error("Offline booking not found");

  if (data.primaryGuest) ob.primaryGuest = { ...ob.primaryGuest, ...data.primaryGuest };
  if (data.allGuests !== undefined) ob.allGuests = data.allGuests;
  if (data.totalGuests !== undefined) ob.totalGuests = data.totalGuests;
  if (data.specialRequests !== undefined) ob.specialRequests = data.specialRequests;
  if (data.adminNotes !== undefined) ob.adminNotes = data.adminNotes;
  if (data.internalNotes !== undefined) ob.internalNotes = data.internalNotes;
  if (data.discountAmount !== undefined) {
    ob.discountAmount = data.discountAmount;
    ob.finalAmount = ob.totalAmount - data.discountAmount;
  }
  ob.updatedBy = user.id;
  await ob.save();

  await logEvent({
    roomId: ob.room,
    propertyId: ob.property,
    type: "offline_booking_updated",
    message: `Offline booking ${ob.referenceNumber} updated`,
    performedBy: user.id,
    performedByName: user.name,
    offlineBooking: ob._id,
  });

  revalidatePath(`/admin/rooms/${ob.room}`);
  return { success: true };
}

// ─── 13. Cancel offline booking ───────────────────────────────────────────────

export async function cancelOfflineBooking(offlineBookingId, reason = "") {
  const user = await requireWrite();
  await dbConnect();

  const ob = await OfflineBooking.findById(offlineBookingId);
  if (!ob) throw new Error("Offline booking not found");
  if (["cancelled", "checked_out"].includes(ob.status)) throw new Error("Cannot cancel this booking");

  ob.status = "cancelled";
  ob.cancellationReason = reason;
  ob.cancelledBy = user.id;
  ob.hasConflict = false;
  await ob.save();

  await logEvent({
    roomId: ob.room,
    propertyId: ob.property,
    type: "offline_booking_cancelled",
    message: `Offline booking ${ob.referenceNumber} cancelled${reason ? `: ${reason}` : ""}`,
    performedBy: user.id,
    performedByName: user.name,
    offlineBooking: ob._id,
    meta: { reason },
  });

  revalidatePath("/admin/rooms");
  revalidatePath(`/admin/rooms/${ob.room}`);
  return { success: true };
}

// ─── 14. Check in offline guest ───────────────────────────────────────────────

export async function checkInOffline(offlineBookingId) {
  const user = await requireWrite();
  await dbConnect();

  const ob = await OfflineBooking.findById(offlineBookingId);
  if (!ob) throw new Error("Offline booking not found");
  if (ob.status === "checked_in") throw new Error("Already checked in");
  if (["cancelled", "checked_out", "no_show"].includes(ob.status)) {
    throw new Error("Cannot check in — booking is " + ob.status);
  }

  ob.status = "checked_in";
  ob.actualCheckIn = new Date();
  await ob.save();

  // Sync room status
  await Room.findByIdAndUpdate(ob.room, { status: "occupied" });

  await logEvent({
    roomId: ob.room,
    propertyId: ob.property,
    type: "check_in",
    message: `${ob.primaryGuest.name} checked in (offline booking ${ob.referenceNumber})`,
    performedBy: user.id,
    performedByName: user.name,
    offlineBooking: ob._id,
    meta: { actualCheckIn: ob.actualCheckIn },
  });

  revalidatePath("/admin/rooms");
  revalidatePath(`/admin/rooms/${ob.room}`);
  return { success: true };
}

// ─── 15. Check out offline guest ──────────────────────────────────────────────

export async function checkOutOffline(offlineBookingId) {
  const user = await requireWrite();
  await dbConnect();

  const ob = await OfflineBooking.findById(offlineBookingId);
  if (!ob) throw new Error("Offline booking not found");
  if (ob.status !== "checked_in") throw new Error("Guest is not currently checked in");

  ob.status = "checked_out";
  ob.actualCheckOut = new Date();
  await ob.save();

  // Sync room status → available (unless another booking is active)
  const otherActive = await OfflineBooking.findOne({
    room: ob.room,
    status: "checked_in",
    _id: { $ne: ob._id },
  });
  const otherOnline = await Booking.findOne({
    "roomBookings.room": ob.room,
    status: "checked_in",
  });

  if (!otherActive && !otherOnline) {
    await Room.findByIdAndUpdate(ob.room, { status: "available" });
  }

  await logEvent({
    roomId: ob.room,
    propertyId: ob.property,
    type: "check_out",
    message: `${ob.primaryGuest.name} checked out (offline booking ${ob.referenceNumber})`,
    performedBy: user.id,
    performedByName: user.name,
    offlineBooking: ob._id,
    meta: { actualCheckOut: ob.actualCheckOut },
  });

  revalidatePath("/admin/rooms");
  revalidatePath(`/admin/rooms/${ob.room}`);
  return { success: true };
}

// ─── 16. Record payment for offline booking ───────────────────────────────────

export async function addOfflinePayment(offlineBookingId, { amount, method, note }) {
  const user = await requireWrite();
  await dbConnect();

  const ob = await OfflineBooking.findById(offlineBookingId);
  if (!ob) throw new Error("Offline booking not found");
  if (["cancelled", "checked_out"].includes(ob.status)) {
    throw new Error("Cannot add payment to this booking");
  }

  ob.payments.push({
    amount,
    method: method || "cash",
    note,
    receivedBy: user.id,
    receivedByName: user.name,
    receivedAt: new Date(),
  });
  await ob.save(); // Pre-save hook recalculates paidAmount & paymentStatus

  await logEvent({
    roomId: ob.room,
    propertyId: ob.property,
    type: "payment_received",
    message: `Payment of ৳${amount} received (${method || "cash"}) for ${ob.referenceNumber}`,
    performedBy: user.id,
    performedByName: user.name,
    offlineBooking: ob._id,
    meta: { amount, method, newPaidAmount: ob.paidAmount, remaining: ob.remainingAmount },
  });

  revalidatePath(`/admin/rooms/${ob.room}`);
  return { success: true, paidAmount: ob.paidAmount, remainingAmount: ob.remainingAmount };
}

// ─── 17. Report maintenance issue on offline booking ─────────────────────────

export async function addMaintenanceIssue(offlineBookingId, { description, priority }) {
  const user = await requireWrite();
  await dbConnect();

  const ob = await OfflineBooking.findById(offlineBookingId);
  if (!ob) throw new Error("Offline booking not found");

  ob.issues.push({
    description,
    priority: priority || "medium",
    reportedBy: user.id,
    reportedByName: user.name,
    status: "open",
  });
  await ob.save();

  await logEvent({
    roomId: ob.room,
    propertyId: ob.property,
    type: "maintenance_added",
    message: `Issue reported: ${description}`,
    performedBy: user.id,
    performedByName: user.name,
    offlineBooking: ob._id,
    meta: { priority, description },
  });

  revalidatePath(`/admin/rooms/${ob.room}`);
  return { success: true };
}

// ─── 18. Resolve maintenance issue ───────────────────────────────────────────

export async function resolveMaintenanceIssue(offlineBookingId, issueId, resolution = "") {
  const user = await requireWrite();
  await dbConnect();

  const ob = await OfflineBooking.findById(offlineBookingId);
  if (!ob) throw new Error("Offline booking not found");

  const issue = ob.issues.id(issueId);
  if (!issue) throw new Error("Issue not found");

  issue.status = "resolved";
  issue.resolvedAt = new Date();
  issue.resolvedBy = user.id;
  issue.resolvedByName = user.name;
  issue.resolution = resolution;
  await ob.save();

  await logEvent({
    roomId: ob.room,
    propertyId: ob.property,
    type: "maintenance_resolved",
    message: `Issue resolved: ${issue.description}${resolution ? ` — ${resolution}` : ""}`,
    performedBy: user.id,
    performedByName: user.name,
    offlineBooking: ob._id,
    meta: { issueId, resolution },
  });

  revalidatePath(`/admin/rooms/${ob.room}`);
  return { success: true };
}

// ─── 19. Resolve conflict (mark offline booking conflict-free) ────────────────

export async function resolveConflict(offlineBookingId, resolution) {
  const user = await requireWrite();
  await dbConnect();

  const ob = await OfflineBooking.findById(offlineBookingId);
  if (!ob) throw new Error("Offline booking not found");

  ob.hasConflict = false;
  ob.conflictNote = `Resolved: ${resolution}`;
  await ob.save();

  await logEvent({
    roomId: ob.room,
    propertyId: ob.property,
    type: "conflict_resolved",
    message: `Conflict resolved: ${resolution}`,
    performedBy: user.id,
    performedByName: user.name,
    offlineBooking: ob._id,
  });

  revalidatePath(`/admin/rooms/${ob.room}`);
  return { success: true };
}

// ─── 20. Bulk actions ─────────────────────────────────────────────────────────

export async function markRoomMaintenance(roomId, issueDescription) {
  const user = await requireWrite();
  await dbConnect();

  const room = await Room.findById(roomId).select("status property roomNumber");
  if (!room) throw new Error("Room not found");

  const prevStatus = room.status;
  room.status = "maintenance";
  await room.save();

  await logEvent({
    roomId,
    propertyId: room.property,
    type: "maintenance_added",
    message: `Room put into maintenance from "${prevStatus}"${issueDescription ? `: ${issueDescription}` : ""}`,
    performedBy: user.id,
    performedByName: user.name,
    meta: { prevStatus, issue: issueDescription },
  });

  revalidatePath("/admin/rooms");
  revalidatePath(`/admin/rooms/${roomId}`);
  return { success: true };
}

// ─── getRoomBookingsForRange: calendar data ───────────────────────────────────

/**
 * Returns all bookings (online + offline) for a room within [from, to].
 * Used by the per-room calendar view.
 */
export async function getRoomBookingsForRange(roomId, from, to) {
  await requireRead();
  await dbConnect();

  const fromDate = new Date(from);
  const toDate   = new Date(to);

  const [onlineBookings, offlineBookings] = await Promise.all([
    Booking.find({
      "roomBookings.room": roomId,
      status: { $nin: ["pending", "cancelled", "no_show"] },
      checkIn:  { $lt: toDate },
      checkOut: { $gt: fromDate },
    })
      .select("bookingNumber status checkIn checkOut primaryGuest totalAmount paidAmount remainingAmount paymentStatus nights bookingMode")
      .sort({ checkIn: 1 })
      .lean(),

    OfflineBooking.find({
      room: roomId,
      status: { $nin: ["cancelled", "no_show"] },
      checkIn:  { $lt: toDate },
      checkOut: { $gt: fromDate },
    })
      .select("referenceNumber status checkIn checkOut primaryGuest finalAmount paidAmount remainingAmount nights createdByName")
      .sort({ checkIn: 1 })
      .lean(),
  ]);

  const bookings = [
    ...onlineBookings.map((b) => ({
      _id:             b._id.toString(),
      source:          "online",
      ref:             b.bookingNumber,
      status:          b.status,
      checkIn:         b.checkIn,
      checkOut:        b.checkOut,
      guestName:       b.primaryGuest?.name || "Guest",
      guestPhone:      b.primaryGuest?.phone || "",
      totalAmount:     b.totalAmount,
      paidAmount:      b.paidAmount,
      remainingAmount: b.remainingAmount,
      paymentStatus:   b.paymentStatus,
      nights:          b.nights,
      bookingMode:     b.bookingMode,
    })),
    ...offlineBookings.map((b) => ({
      _id:             b._id.toString(),
      source:          "offline",
      ref:             b.referenceNumber,
      status:          b.status,
      checkIn:         b.checkIn,
      checkOut:        b.checkOut,
      guestName:       b.primaryGuest?.name || "Guest",
      guestPhone:      b.primaryGuest?.phone || "",
      totalAmount:     b.finalAmount,
      paidAmount:      b.paidAmount,
      remainingAmount: b.remainingAmount,
      paymentStatus:   b.paidAmount >= b.finalAmount ? "paid" : b.paidAmount > 0 ? "partial" : "unpaid",
      nights:          b.nights,
      bookingMode:     "night_stay",
    })),
  ].sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn));

  return JSON.parse(JSON.stringify(bookings));
}
