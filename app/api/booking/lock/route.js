/**
 * POST /api/booking/lock
 * Lock rooms for 60 seconds during payment.
 * Returns { success, lockedUntil } or { error }
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import BookingLock from "@/models/BookingLock";
import Booking from "@/models/Booking";
import PaymentAttempt from "@/models/PaymentAttempt";

const LOCK_DURATION_MS = 60 * 1000; // 1 minute
const ABUSE_THRESHOLD  = 5;         // locks without paying

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

    const conflicts = [];

    for (const roomId of rooms) {
      // Check existing confirmed bookings
      const booked = await Booking.exists({
        $or: [
          { room: roomId },
          { "roomBookings.room": roomId },
        ],
        status: { $nin: ["cancelled", "no_show"] },
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

    return NextResponse.json({ success: true, lockedUntil: expiresAt.toISOString() });
  } catch (err) {
    console.error("Lock error:", err);
    return NextResponse.json({ error: "Failed to lock rooms. Please try again." }, { status: 500 });
  }
}
