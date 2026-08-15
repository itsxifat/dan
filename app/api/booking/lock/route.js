/**
 * POST /api/booking/lock
 * Hold the chosen rooms so no one else can check out with them.
 * The hold is released as soon as the guest leaves checkout — see
 * /api/booking/unlock. LOCK_DURATION_MS is only the outer limit.
 *
 * Returns { success, lockedUntil, lockDurationMs } or { error }
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import BookingLock from "@/models/BookingLock";
import Booking from "@/models/Booking";
import PaymentAttempt from "@/models/PaymentAttempt";
import { LOCK_DURATION_MS } from "@/lib/bookingLock";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const body    = await req.json();
    const { rooms, checkIn, checkOut, bookingMode, sessionId } = body;

    if (!rooms?.length || !checkIn || !checkOut) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    await dbConnect();

    const userId    = session?.user?.id || null;
    const ip        = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const identifier = userId || ip;
    const identType  = userId ? "user" : "ip";

    // Check if this identifier is banned
    const attempt = await PaymentAttempt.findOne({ identifier, type: identType });
    if (attempt?.banned) {
      return NextResponse.json({ error: "Your account has been restricted due to suspicious activity. Please contact support." }, { status: 403 });
    }

    const checkInDate  = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const now          = new Date();
    const expiresAt    = new Date(now.getTime() + LOCK_DURATION_MS);

    // Clean up this user's own orphaned pending bookings for these rooms/dates
    // so a failed payment attempt doesn't block them from retrying. Never touch
    // a booking that has already taken money.
    if (userId) {
      await Booking.deleteMany({
        bookedBy: userId,
        status: "pending",
        paymentStatus: "unpaid",
        checkIn:  { $lt: checkOutDate },
        checkOut: { $gt: checkInDate },
        $or: [
          { room: { $in: rooms } },
          { "roomBookings.room": { $in: rooms } },
        ],
      });
    }

    // Sweep abandoned payment-in-progress bookings from ANY user. A "pending"
    // booking is only real while its hold is alive; past that the guest never
    // came back, and leaving the row behind makes the room permanently
    // unlockable even though availability still advertises it as free.
    await Booking.deleteMany({
      status: "pending",
      paymentStatus: "unpaid",
      createdAt: { $lt: new Date(now.getTime() - LOCK_DURATION_MS) },
      $or: [
        { room: { $in: rooms } },
        { "roomBookings.room": { $in: rooms } },
      ],
    });

    const conflicts = [];

    for (const roomId of rooms) {
      // Confirmed bookings block the room. "pending" is deliberately excluded —
      // it means a payment is in progress, and the hold below is what guards
      // that window. Availability queries use the same rule, so a room can
      // never look free here and unavailable there.
      const booked = await Booking.exists({
        $or: [
          { room: roomId },
          { "roomBookings.room": roomId },
        ],
        status: { $nin: ["cancelled", "no_show", "pending"] },
        checkIn:  { $lt: checkOutDate },
        checkOut: { $gt: checkInDate },
      });
      if (booked) {
        conflicts.push(roomId);
        continue;
      }

      // Check existing active locks (by other sessions)
      const locked = await BookingLock.findOne({
        roomId,
        checkIn:  { $lt: checkOutDate },
        checkOut: { $gt: checkInDate },
        expiresAt: { $gt: now },
        sessionId: { $ne: sessionId },
        ...(userId ? { userId: { $ne: userId } } : {}),
      });
      if (locked) {
        conflicts.push(roomId);
      }
    }

    if (conflicts.length > 0) {
      return NextResponse.json({
        error: "One or more selected rooms became unavailable. Please re-check availability.",
        conflictedRooms: conflicts,
      }, { status: 409 });
    }

    // Remove any previous locks from this session for the same rooms/dates
    await BookingLock.deleteMany({
      roomId: { $in: rooms },
      $or: [
        { sessionId },
        ...(userId ? [{ userId }] : []),
      ],
    });

    // Create new locks
    const lockDocs = rooms.map((roomId) => ({
      roomId,
      date:     checkIn,
      checkIn:  checkInDate,
      checkOut: checkOutDate,
      userId,
      sessionId: sessionId || "",
      lockedAt:  now,
      expiresAt,
    }));

    await BookingLock.insertMany(lockDocs);

    return NextResponse.json({
      success: true,
      lockedUntil: expiresAt.toISOString(),
      lockDurationMs: LOCK_DURATION_MS,
    });
  } catch (err) {
    console.error("Lock error:", err);
    return NextResponse.json({ error: "Failed to lock rooms. Please try again." }, { status: 500 });
  }
}
