"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { updateBookingStatus } from "@/actions/accommodation/bookingActions";

const STATUS_STYLE = {
  pending:     "bg-amber-400/10 text-amber-400 border-amber-400/25",
  confirmed:   "bg-blue-400/10 text-blue-400 border-blue-400/25",
  checked_in:  "bg-emerald-400/10 text-emerald-400 border-emerald-400/25",
  checked_out: "bg-white/5 text-white/40 border-white/15",
  cancelled:   "bg-red-400/10 text-red-400 border-red-400/25",
  no_show:     "bg-red-900/20 text-red-400/60 border-red-400/15",
};

const PAYMENT_STYLE = {
  paid:     "text-emerald-400",
  unpaid:   "text-amber-400",
  failed:   "text-red-400",
  refunded: "text-white/40",
};

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "–";
}

export default function BookingsTable({
  initialBookings, total, pages, currentPage, currentStatus, currentSearch,
  statusOpts, canWrite,
}) {
  const router   = useRouter();
  const pathname = usePathname();
  const qs       = useSearchParams();

  const [bookings, setBookings] = useState(initialBookings);
  const [search, setSearch]     = useState(currentSearch);
  const [isPending, startTransition] = useTransition();

  function applyFilter(updates) {
    const p = new URLSearchParams(qs.toString());
    Object.entries(updates).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    p.delete("page");
    router.push(`${pathname}?${p.toString()}`);
  }

  function handleSearch(e) {
    e.preventDefault();
    applyFilter({ search });
  }

  function handleStatusChange(bookingId, status) {
    startTransition(async () => {
      await updateBookingStatus(bookingId, status);
      setBookings((prev) =>
        prev.map((b) => b._id === bookingId ? { ...b, status } : b)
      );
    });
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Status filter */}
        <div className="flex flex-wrap gap-1.5">
          {statusOpts.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => applyFilter({ status: value })}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all duration-200
                ${currentStatus === value
                  ? "bg-[#7A2267]/20 border-[#7A2267]/50 text-[#c05aae]"
                  : "border-white/[0.08] text-white/30 hover:text-white/55 hover:border-white/15"
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search booking # or guest name…"
            className="flex-1 bg-white/[0.03] border border-white/[0.07] rounded-xl px-3.5 py-2
              text-[12px] text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors"
          />
          <button type="submit" className="px-4 py-2 rounded-xl bg-white/[0.06] text-white/50 text-[12px]
            hover:bg-white/[0.09] hover:text-white/75 transition-all duration-200">
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      {bookings.length === 0 ? (
        <div className="text-center py-20 text-white/20 text-[14px]">No bookings found.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
          <table className="w-full text-[12px] min-w-[700px]">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Booking #", "Guest", "Property", "Dates", "Amount", "Status", "Payment", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[9.5px] uppercase tracking-wider text-white/25 font-semibold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-mono text-[11px] text-white/50">{b.bookingNumber}</td>
                  <td className="px-4 py-3">
                    <p className="text-white/70 font-medium truncate max-w-[120px]">{b.primaryGuest?.name}</p>
                    <p className="text-[10.5px] text-white/25 truncate max-w-[120px]">{b.primaryGuest?.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white/55 truncate max-w-[120px]">{b.property?.name}</p>
                    {b.category?.name && (
                      <p className="text-[10.5px] text-white/25 truncate">{b.category.name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-white/45">{fmtDate(b.checkIn)}</p>
                    <p className="text-[10.5px] text-white/25">{fmtDate(b.checkOut)} · {b.nights}n</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-white/55">
                    ৳{b.totalAmount?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {canWrite ? (
                      <select
                        value={b.status}
                        onChange={(e) => handleStatusChange(b._id, e.target.value)}
                        disabled={isPending}
                        className={`text-[10px] uppercase tracking-wide border rounded-full px-2.5 py-1
                          bg-transparent font-medium cursor-pointer focus:outline-none disabled:opacity-50
                          transition-all duration-200 ${STATUS_STYLE[b.status]}`}
                      >
                        {["pending","confirmed","checked_in","checked_out","cancelled","no_show"].map((s) => (
                          <option key={s} value={s} className="bg-[#111] text-white capitalize">
                            {s.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`text-[10px] uppercase tracking-wide border rounded-full px-2.5 py-1 font-medium ${STATUS_STYLE[b.status]}`}>
                        {b.status.replace("_", " ")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10.5px] font-medium capitalize ${PAYMENT_STYLE[b.paymentStatus]}`}>
                      {b.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/bookings/${b._id}`}
                      className="text-[10.5px] text-white/25 hover:text-white/60 transition-colors duration-200"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => applyFilter({ page: String(p) })}
              className={`w-8 h-8 rounded-lg text-[12px] transition-all duration-200
                ${p === currentPage
                  ? "bg-[#7A2267] text-white"
                  : "text-white/30 hover:text-white/65 hover:bg-white/[0.06]"
                }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
