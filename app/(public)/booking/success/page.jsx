import dbConnect from "@/lib/db";
import Booking from "@/models/Booking";
import Settings from "@/models/Settings";
import { summariseFromBooking, docNoticeLines, docNoticeHeadline } from "@/lib/guestDocs";
import SuccessClient from "./SuccessClient";

export const metadata = { title: "Booking Confirmed — Dhali's Amber Nivaas" };
export const dynamic = "force-dynamic";

export default async function BookingSuccessPage({ searchParams }) {
  const params = await searchParams;
  const ref    = params?.ref;

  let booking = null;
  let docNotice = null;

  if (ref) {
    await dbConnect();
    const [found, settings] = await Promise.all([
      Booking.findOne({ bookingNumber: ref })
        .populate("property", "name location coverImage")
        .populate("roomBookings.room", "roomNumber floor")
        .lean(),
      Settings.findOne().lean(),
    ]);
    booking = found;

    // Identification requirements, resolved on the server so the confirmation
    // screen says exactly what the email and invoice say.
    if (booking?.roomBookings?.length > 0) {
      const summary = summariseFromBooking(booking, settings || {});
      const lines   = docNoticeLines(summary);
      if (lines.length > 0) {
        docNotice = {
          headline: docNoticeHeadline(summary),
          lines,
          certRooms: summary.marriageCertRooms,
        };
      }
    }
  }

  return (
    <SuccessClient
      booking={booking ? JSON.parse(JSON.stringify(booking)) : null}
      docNotice={docNotice}
    />
  );
}
