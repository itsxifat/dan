import dbConnect from "@/lib/db";
import Booking from "@/models/Booking";
import SuccessClient from "./SuccessClient";

export const metadata = { title: "Booking Confirmed — Dhali's Amber Nivaas" };
export const dynamic = "force-dynamic";

export default async function BookingSuccessPage({ searchParams }) {
  const params = await searchParams;
  const ref    = params?.ref;

  let booking = null;
  if (ref) {
    await dbConnect();
    booking = await Booking.findOne({ bookingNumber: ref })
      .populate("property", "name location coverImage")
      .populate("roomBookings.room", "roomNumber floor")
      .lean();
  }

  return <SuccessClient booking={booking ? JSON.parse(JSON.stringify(booking)) : null} />;
}
