import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getAdminBookings } from "@/actions/accommodation/bookingActions";
import BookingsTable from "./BookingsTable";
import PageHeader from "@/components/admin/PageHeader";

export const metadata = { title: "Bookings — Admin" };
export const dynamic  = "force-dynamic";

const STATUS_OPTS = [
  { value: "",            label: "All"          },
  { value: "pending",     label: "Pending"      },
  { value: "confirmed",   label: "Confirmed"    },
  { value: "checked_in",  label: "Checked In"   },
  { value: "checked_out", label: "Checked Out"  },
  { value: "cancelled",   label: "Cancelled"    },
  { value: "no_show",     label: "No Show"      },
];

export default async function BookingsPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "bookings.read")) redirect("/admin/dashboard");

  const params   = await searchParams;
  const page     = Math.max(1, parseInt(params?.page || "1"));
  const status   = params?.status || "";
  const search   = params?.search || "";
  const canWrite = hasPermission(session.user.role, "bookings.write");

  const { bookings, total, pages } = await getAdminBookings({ page, status, search, limit: 15 });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Bookings"
        subtitle="Reservations, check-ins & payment status"
        count={`${total} total`}
      />

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
