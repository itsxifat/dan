/**
 * POST /api/booking/unlock
 * Release room holds. Called whenever the guest leaves checkout — back
 * navigation, cart change, unmounting the wizard, or closing the tab — so a
 * room never stays reserved just because someone wandered off.
 *
 * Must tolerate a navigator.sendBeacon body (fired during page unload).
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import BookingLock from "@/models/BookingLock";
import Booking from "@/models/Booking";
import PaymentAttempt from "@/models/PaymentAttempt";

const ABUSE_THRESHOLD = 5;

/** sendBeacon may arrive as text/plain, so parse the raw body rather than trusting the type. */
async function readBody(req) {
  try {
    const text = await req.text();
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

export async function POST(req) {
  try {
    const body        = await readBody(req);
    const nextSession = await getServerSession(authOptions);
    const { sessionId, rooms, recordAbuse } = body;

    const userId     = nextSession?.user?.id || null;
    const ip         = req.headers.get?.("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const identifier = userId || ip;
    const identType  = userId ? "user" : "ip";

    // Nothing identifies the holder — there is nothing safe to release.
    if (!sessionId && !userId) {
      return NextResponse.json({ success: true, released: 0 });
    }

    await dbConnect();

    // Only ever release holds this caller owns.
    const owner = { $or: [
      ...(sessionId ? [{ sessionId }] : []),
      ...(userId    ? [{ userId }]    : []),
    ] };
    // When the client names its rooms, release just those — a guest with a
    // second tab open keeps the hold they are still using.
    const query = rooms?.length > 0 ? { ...owner, roomId: { $in: rooms } } : owner;

    const { deletedCount } = await BookingLock.deleteMany(query);

    // Drop the payment-in-progress booking the abandoned hold belonged to,
    // otherwise it lingers as a phantom conflict until someone sweeps it.
    // An empty transactionId means the payment page was never even reached.
    if (userId) {
      await Booking.deleteMany({
        bookedBy:      userId,
        status:        "pending",
        paymentStatus: "unpaid",
        transactionId: "",
        ...(rooms?.length > 0 ? { "roomBookings.room": { $in: rooms } } : {}),
      });
    }

    // Abuse tracking is opt-in — ordinary navigation must never count against
    // the guest, or simply browsing away would suspend their account.
    if (recordAbuse === true && identifier) {
      const attempt = await PaymentAttempt.findOneAndUpdate(
        { identifier, type: identType },
        {
          $inc: { count: 1 },
          $setOnInsert: { windowStart: new Date() },
        },
        { upsert: true, returnDocument: "after" }
      );

      if (attempt && attempt.count >= ABUSE_THRESHOLD && !attempt.banned) {
        await PaymentAttempt.findByIdAndUpdate(attempt._id, {
          banned: true,
          bannedAt: new Date(),
        });

        // If it's a user account, suspend them
        if (userId) {
          const User = (await import("@/models/User")).default;
          await User.findByIdAndUpdate(userId, { status: "suspended" });
        }
      }
    }

    return NextResponse.json({ success: true, released: deletedCount ?? 0 });
  } catch (err) {
    console.error("Unlock error:", err);
    return NextResponse.json({ error: "Unlock failed." }, { status: 500 });
  }
}
