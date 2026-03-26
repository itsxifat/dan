"use client";

import { useState, useTransition } from "react";
import { Montserrat } from "next/font/google";
import { updateVisitStatus, deleteVisitRequest } from "@/actions/corporate/corporateActions";

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

function RequestRow({ req, onStatusChange, onDelete }) {
  const [open, setOpen]   = useState(false);
  const [isPending, start] = useTransition();

  function changeStatus(newStatus) {
    start(async () => {
      await onStatusChange(req._id, newStatus);
    });
  }

  return (
    <>
      <tr
        className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors duration-150 cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        <td className="py-3.5 px-4">
          <p className={`${sans.className} text-[12px] font-semibold text-white/85`}>{req.fullName}</p>
          <p className={`${sans.className} text-[10.5px] text-white/35`}>{req.company}</p>
        </td>
        <td className="py-3.5 px-4 hidden md:table-cell">
          <p className={`${sans.className} text-[11.5px] text-white/60`}>{req.designation}</p>
        </td>
        <td className="py-3.5 px-4 hidden lg:table-cell">
          <p className={`${sans.className} text-[11.5px] text-white/50`}>{req.email}</p>
          <p className={`${sans.className} text-[10.5px] text-white/30`}>{req.phone}</p>
        </td>
        <td className="py-3.5 px-4 hidden sm:table-cell">
          <p className={`${sans.className} text-[11px] text-white/55`}>{req.visitDate}</p>
          <p className={`${sans.className} text-[10px] text-white/30`}>{req.visitTime?.split(" ")[0] || ""}</p>
        </td>
        <td className="py-3.5 px-4 hidden sm:table-cell">
          <p className={`${sans.className} text-[11px] text-white/55`}>{req.visitorCount} person{req.visitorCount !== 1 ? "s" : ""}</p>
        </td>
        <td className="py-3.5 px-4">
          <span className={`${sans.className} text-[9.5px] uppercase tracking-wider font-semibold
            px-2.5 py-1 rounded-full border ${STATUS_STYLES[req.status] || STATUS_STYLES.new}`}>
            {req.status}
          </span>
        </td>
        <td className="py-3.5 px-4 text-right">
          <svg viewBox="0 0 10 6" width="8" height="8" fill="none"
            className={`inline-block text-white/30 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
            <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </td>
      </tr>

      {/* Expanded detail row */}
      {open && (
        <tr className="border-b border-white/[0.04] bg-white/[0.015]">
          <td colSpan={7} className="px-4 py-5">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {[
                { label: "Event Type",    val: req.eventType || "—" },
                { label: "Visit Time",    val: req.visitTime || "—" },
                { label: "Visitor Count", val: `${req.visitorCount} person(s)` },
                { label: "Submitted",     val: fmt(req.createdAt) },
              ].map((f) => (
                <div key={f.label}>
                  <p className={`${sans.className} text-[9px] uppercase tracking-[0.18em] text-white/25 mb-0.5`}>{f.label}</p>
                  <p className={`${sans.className} text-[12px] text-white/65`}>{f.val}</p>
                </div>
              ))}
            </div>

            {req.eventSummary && (
              <div className="mb-4">
                <p className={`${sans.className} text-[9px] uppercase tracking-[0.18em] text-white/25 mb-1`}>Event Summary</p>
                <p className={`${sans.className} text-[12px] text-white/60 leading-[1.7]`}>{req.eventSummary}</p>
              </div>
            )}
            {req.message && (
              <div className="mb-4">
                <p className={`${sans.className} text-[9px] uppercase tracking-[0.18em] text-white/25 mb-1`}>Additional Notes</p>
                <p className={`${sans.className} text-[12px] text-white/50 leading-[1.7] italic`}>{req.message}</p>
              </div>
            )}

            {/* Status changer + Delete */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/[0.05]">
              <p className={`${sans.className} text-[9px] uppercase tracking-wider text-white/30 mr-1`}>Update Status:</p>
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={(e) => { e.stopPropagation(); changeStatus(s); }}
                  disabled={isPending || req.status === s}
                  className={`${sans.className} text-[9px] uppercase tracking-wider font-semibold
                    px-3 py-1.5 rounded-full border transition-all duration-150
                    ${req.status === s
                      ? `${STATUS_STYLES[s]} opacity-100`
                      : "border-white/10 text-white/30 hover:border-white/25 hover:text-white/60"
                    }
                    disabled:cursor-not-allowed`}
                >
                  {s}
                </button>
              ))}
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(req._id); }}
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

export default function VisitsManager({ initialData, initialStatus }) {
  const [data, setData]         = useState(initialData);
  const [filter, setFilter]     = useState(initialStatus || "");
  const [isPending, start]      = useTransition();

  const requests = data?.requests || [];

  async function handleStatusChange(id, status) {
    await updateVisitStatus(id, status);
    // Optimistic update
    setData((d) => ({
      ...d,
      requests: d.requests.map((r) => r._id === id ? { ...r, status } : r),
    }));
  }

  async function handleDelete(id) {
    if (!confirm("Delete this visit request?")) return;
    start(async () => {
      await deleteVisitRequest(id);
      setData((d) => ({
        ...d,
        requests: d.requests.filter((r) => r._id !== id),
        total: d.total - 1,
      }));
    });
  }

  const filtered = filter ? requests.filter((r) => r.status === filter) : requests;

  return (
    <div className={`${sans.className} p-5 sm:p-8 max-w-7xl`}>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[18px] font-semibold text-white/90">Corporate Visit Requests</h1>
          <p className="text-[11px] text-white/30 mt-0.5">{data.total} total request{data.total !== 1 ? "s" : ""}</p>
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
                  : "border-white/[0.08] text-white/35 hover:text-white/60 hover:border-white/20"
                }`}
            >
              {s || "All"} {s === "" && `(${data.total})`}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.06]
            flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
              <rect x="2" y="3" width="16" height="14" rx="2" stroke="rgba(255,255,255,0.25)" strokeWidth="1.3" />
              <path d="M6 7h8M6 10h5" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-[13px] text-white/30">No visit requests{filter ? ` with status "${filter}"` : ""}.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                {["Name / Company", "Designation", "Contact", "Visit Date", "Visitors", "Status", ""].map((h) => (
                  <th key={h}
                    className={`text-left py-2.5 px-4 text-[9px] uppercase tracking-[0.18em] text-white/25 font-semibold
                      ${h === "Designation" ? "hidden md:table-cell" : ""}
                      ${h === "Contact" ? "hidden lg:table-cell" : ""}
                      ${h === "Visit Date" || h === "Visitors" ? "hidden sm:table-cell" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((req) => (
                <RequestRow
                  key={req._id}
                  req={req}
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
