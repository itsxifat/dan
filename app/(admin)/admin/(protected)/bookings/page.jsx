import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getAdminBookings } from "@/actions/accommodation/bookingActions";
import BookingsTable from "./BookingsTable";

export const metadata = { title: "Bookings — Admin" };
export const dynamic = "force-dynamic";

const STATUS_OPTS = [
  { value: "",           label: "All"         },
  { value: "pending",    label: "Pending"     },
  { value: "confirmed",  label: "Confirmed"   },
  { value: "checked_in", label: "Checked In"  },
  { value: "checked_out",label: "Checked Out" },
  { value: "cancelled",  label: "Cancelled"   },
  { value: "no_show",    label: "No Show"     },
];

export default async function BookingsPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "bookings.read")) redirect("/admin/dashboard");

  const params  = await searchParams;
  const page    = Math.max(1, parseInt(params?.page || "1"));
  const status  = params?.status || "";
  const search  = params?.search || "";

  const canWrite = hasPermission(session.user.role, "bookings.write");

  const { bookings, total, pages } = await getAdminBookings({ page, status, search, limit: 15 });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h2 className="text-[18px] font-semibold text-white/85">Bookings</h2>
        <p className="text-[11px] text-white/30 mt-0.5">{total} total reservations</p>
      </div>

      <BookingsTable
        initialBookings={bookings}
        total={total}
        pages={pages}
        currentPage={page}
        currentStatus={status}
        currentSearch={search}
        statusOpts={STATUS_OPTS}
        canWrite={canWrite}
      />
    </div>
  );
}
