/**
 * POST /api/booking/unlock
 * Release room locks (called on payment cancel/fail or explicit back navigation).
 * Also records an abuse attempt if unlock is called without a successful payment.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import BookingLock from "@/models/BookingLock";
import PaymentAttempt from "@/models/PaymentAttempt";

const ABUSE_THRESHOLD = 5;

export async function POST(req) {
  try {
    const session   = await req.json().catch(() => ({}));
    const nextSession = await getServerSession(authOptions);
    const { sessionId, recordAbuse } = session;

    const userId     = nextSession?.user?.id || null;
    const ip         = req.headers.get?.("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const identifier = userId || ip;
    const identType  = userId ? "user" : "ip";

    await dbConnect();

    // Remove locks
    if (sessionId) {
      await BookingLock.deleteMany({
        $or: [
          { sessionId },
          ...(userId ? [{ userId }] : []),
        ],
      });
    }

    // Record abuse if caller indicates no payment was made
    if (recordAbuse && identifier) {
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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Unlock error:", err);
    return NextResponse.json({ error: "Unlock failed." }, { status: 500 });
  }
}
