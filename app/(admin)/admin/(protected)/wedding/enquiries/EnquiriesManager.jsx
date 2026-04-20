"use client";

import { useState, useTransition } from "react";
import { Montserrat } from "next/font/google";
import { updateEnquiryStatus, deleteWeddingEnquiry } from "@/actions/wedding/weddingActions";

const sans = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });

const STATUS_STYLES = {
  new:       "bg-blue-500/15 text-blue-400 border-blue-500/25",
  contacted: "bg-amber-400/15 text-amber-400 border-amber-400/25",
  confirmed: "bg-emerald-400/15 text-emerald-400 border-emerald-400/25",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/25",
};

const STATUS_OPTIONS = ["new", "contacted", "confirmed", "cancelled"];

function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function venueLabel(slug) {
  if (!slug) return "—";
  if (slug === "not-sure") return "Not sure yet";
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function EnquiryRow({ enq, onStatusChange, onDelete }) {
  const [open, setOpen]    = useState(false);
  const [isPending, start] = useTransition();

  function changeStatus(newStatus) {
    start(async () => { await onStatusChange(enq._id, newStatus); });
  }

  return (
    <>
      <tr
        className="border-b border-white/4 hover:bg-white/[0.02] transition-colors duration-150 cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        {/* Name / Email */}
        <td className="py-3.5 px-4">
          <p className={`${sans.className} text-[12px] font-semibold text-white/85`}>{enq.name}</p>
          <p className={`${sans.className} text-[10.5px] text-white/35`}>{enq.email}</p>
        </td>

        {/* Phone */}
        <td className="py-3.5 px-4 hidden md:table-cell">
          <p className={`${sans.className} text-[11.5px] text-white/55`}>{enq.phone}</p>
        </td>

        {/* Event date */}
        <td className="py-3.5 px-4 hidden sm:table-cell">
          <p className={`${sans.className} text-[11px] text-white/55`}>{enq.eventDate || "—"}</p>
        </td>

        {/* Guests */}
        <td className="py-3.5 px-4 hidden lg:table-cell">
          <p className={`${sans.className} text-[11px] text-white/55`}>
            {enq.guestCount > 0 ? `${enq.guestCount} guests` : "—"}
          </p>
        </td>

        {/* Venue */}
        <td className="py-3.5 px-4 hidden xl:table-cell">
          <p className={`${sans.className} text-[11px] text-white/45 truncate max-w-[140px]`}>
            {venueLabel(enq.venue)}
          </p>
        </td>

        {/* Status */}
        <td className="py-3.5 px-4">
          <span className={`${sans.className} text-[9.5px] uppercase tracking-wider font-semibold
            px-2.5 py-1 rounded-full border ${STATUS_STYLES[enq.status] || STATUS_STYLES.new}`}>
            {enq.status}
          </span>
        </td>

        {/* Chevron */}
        <td className="py-3.5 px-4 text-right">
          <svg viewBox="0 0 10 6" width="8" height="8" fill="none"
            className={`inline-block text-white/30 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
            <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </td>
      </tr>

      {/* Expanded detail */}
      {open && (
        <tr className="border-b border-white/4 bg-white/[0.015]">
          <td colSpan={7} className="px-4 py-5">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {[
                { label: "Phone",      val: enq.phone || "—" },
                { label: "Event Date", val: enq.eventDate || "—" },
                { label: "Guests",     val: enq.guestCount > 0 ? `${enq.guestCount} guests` : "—" },
                { label: "Venue",      val: venueLabel(enq.venue) },
                { label: "Submitted",  val: fmt(enq.createdAt) },
              ].map((f) => (
                <div key={f.label}>
                  <p className={`${sans.className} text-[9px] uppercase tracking-[0.18em] text-white/25 mb-0.5`}>{f.label}</p>
                  <p className={`${sans.className} text-[12px] text-white/65`}>{f.val}</p>
                </div>
              ))}
            </div>

            {enq.message && (
              <div className="mb-4">
                <p className={`${sans.className} text-[9px] uppercase tracking-[0.18em] text-white/25 mb-1`}>Message</p>
                <p className={`${sans.className} text-[12px] text-white/55 leading-[1.75] italic`}>{enq.message}</p>
              </div>
            )}

            {/* Status + Delete */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/5">
              <p className={`${sans.className} text-[9px] uppercase tracking-wider text-white/30 mr-1`}>Update Status:</p>
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={(e) => { e.stopPropagation(); changeStatus(s); }}
                  disabled={isPending || enq.status === s}
                  className={`${sans.className} text-[9px] uppercase tracking-wider font-semibold
                    px-3 py-1.5 rounded-full border transition-all duration-150
                    ${enq.status === s
                      ? `${STATUS_STYLES[s]}`
                      : "border-white/10 text-white/30 hover:border-white/25 hover:text-white/60"
                    }
                    disabled:cursor-not-allowed`}
                >
                  {s}
                </button>
              ))}
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(enq._id); }}
                disabled={isPending}
                className={`${sans.className} ml-auto text-[9px] uppercase tracking-wider
                  px-3 py-1.5 rounded-full border border-red-500/20 text-red-400/60
                  hover:border-red-500/40 hover:text-red-400 transition-all duration-150
                  disabled:cursor-not-allowed`}
              >
                Delete
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function EnquiriesManager({ initialData, initialStatus }) {
  const [data, setData]    = useState(initialData);
  const [filter, setFilter] = useState(initialStatus || "");
  const [isPending, start]  = useTransition();

  const enquiries = data?.enquiries || [];

  async function handleStatusChange(id, status) {
    await updateEnquiryStatus(id, status);
    setData((d) => ({
      ...d,
      enquiries: d.enquiries.map((e) => e._id === id ? { ...e, status } : e),
    }));
  }

  async function handleDelete(id) {
    if (!confirm("Delete this enquiry?")) return;
    start(async () => {
      await deleteWeddingEnquiry(id);
      setData((d) => ({
        ...d,
        enquiries: d.enquiries.filter((e) => e._id !== id),
        total: d.total - 1,
      }));
    });
  }

  const filtered = filter ? enquiries.filter((e) => e.status === filter) : enquiries;

  // Count per status
  const counts = enquiries.reduce((acc, e) => {
    acc[e.status] = (acc[e.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className={`${sans.className} p-5 sm:p-8 max-w-7xl`}>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[18px] font-semibold text-white/90">Wedding Enquiries</h1>
          <p className="text-[11px] text-white/30 mt-0.5">{data.total} total enquir{data.total !== 1 ? "ies" : "y"}</p>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {["", ...STATUS_OPTIONS].map((s) => (
            <button
              key={s || "all"}
              onClick={() => setFilter(s)}
              className={`text-[9.5px] uppercase tracking-wider font-semibold px-3.5 py-1.5 rounded-full
                border transition-all duration-150
                ${filter === s
                  ? "bg-[#7A2267]/20 border-[#7A2267]/40 text-[#c084b8]"
                  : "border-white/8 text-white/35 hover:text-white/60 hover:border-white/20"
                }`}
            >
              {s || "All"}{s === "" && ` (${data.total})`}
              {s !== "" && counts[s] ? ` (${counts[s]})` : ""}
            </button>
          ))}
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {STATUS_OPTIONS.map((s) => (
          <div key={s}
            className="rounded-xl px-4 py-3 border border-white/5 bg-white/[0.02] flex items-center justify-between">
            <span className={`${sans.className} text-[9.5px] uppercase tracking-wider text-white/30`}>{s}</span>
            <span className={`${sans.className} text-[15px] font-semibold ${
              s === "new"       ? "text-blue-400"    :
              s === "contacted" ? "text-amber-400"   :
              s === "confirmed" ? "text-emerald-400" : "text-red-400"
            }`}>{counts[s] || 0}</span>
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 rounded-full bg-white/4 border border-white/6
            flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
              <path d="M10 2C7.5 4 4 6.5 4 10a6 6 0 0 0 12 0C16 6.5 12.5 4 10 2z"
                stroke="rgba(255,255,255,0.25)" strokeWidth="1.3" strokeLinejoin="round" />
              <path d="M7.5 10.5a2.5 2.5 0 0 0 5 0"
                stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-[13px] text-white/30">
            No enquiries{filter ? ` with status "${filter}"` : ""}.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/6 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/6 bg-white/[0.02]">
                {[
                  { label: "Name / Email",  cls: "" },
                  { label: "Phone",         cls: "hidden md:table-cell" },
                  { label: "Event Date",    cls: "hidden sm:table-cell" },
                  { label: "Guests",        cls: "hidden lg:table-cell" },
                  { label: "Venue",         cls: "hidden xl:table-cell" },
                  { label: "Status",        cls: "" },
                  { label: "",              cls: "" },
                ].map(({ label, cls }) => (
                  <th key={label}
                    className={`text-left py-2.5 px-4 text-[9px] uppercase tracking-[0.18em]
                      text-white/25 font-semibold ${cls}`}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((enq) => (
                <EnquiryRow
                  key={enq._id}
                  enq={enq}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
