import BookingLock from "@/models/BookingLock";

/**
 * Hand a booking's rooms back to the pool.
 *
 * Called from every terminal payment path — cancelled, failed, and the IPN
 * failure notification — so an abandoned checkout never leaves a room reserved
 * until the TTL catches up. Callers must have connected to the DB already.
 *
 * Safe to call more than once; SSLCommerz can deliver both a redirect and an
 * IPN for the same transaction.
 */
export async function releaseLocksForBooking(booking) {
  if (!booking) return 0;

  const roomIds = [
    ...(booking.room ? [booking.room] : []),
    ...(booking.roomBookings || []).map((rb) => rb.room).filter(Boolean),
  ];
  if (roomIds.length === 0) return 0;

  const { deletedCount } = await BookingLock.deleteMany({
    roomId:   { $in: roomIds },
    checkIn:  { $lt: new Date(booking.checkOut) },
    checkOut: { $gt: new Date(booking.checkIn) },
  });
  return deletedCount ?? 0;
}
