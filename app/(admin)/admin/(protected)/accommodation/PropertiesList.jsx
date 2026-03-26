"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  deleteProperty,
  togglePropertyActive,
  togglePropertyFeatured,
} from "@/actions/accommodation/propertyActions";

const TYPE_STYLE = {
  building: { dot: "bg-blue-400",  badge: "bg-blue-500/10 text-blue-300 border-blue-500/20",  label: "Building" },
  cottage:  { dot: "bg-emerald-400", badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20", label: "Cottage"  },
};

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" className="text-white/25">
      <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 14 14" width="13" height="13" fill="none">
      <path d="M9.5 1.5l3 3L4 13H1v-3L9.5 1.5z" stroke="currentColor" strokeWidth="1.3"
        strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 14 14" width="13" height="13" fill="none">
      <path d="M2 3.5h10M5.5 3.5V2h3v1.5M3 3.5l.75 8.5h6.5L11 3.5" stroke="currentColor"
        strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function PropertiesList({
  initialProperties, total, pages, currentPage, currentType, currentSearch, canWrite,
}) {
  const router      = useRouter();
  const pathname    = usePathname();
  const qs          = useSearchParams();

  const [properties,     setProperties]     = useState(initialProperties);
  const [search,         setSearch]         = useState(currentSearch);
  const [confirmDelete,  setConfirmDelete]  = useState(null);
  const [isPending,      startTransition]   = useTransition();
  const [error,          setError]          = useState("");

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

  function handleToggleActive(id) {
    startTransition(async () => {
      await togglePropertyActive(id);
      setProperties((prev) => prev.map((p) => p._id === id ? { ...p, isActive: !p.isActive } : p));
    });
  }

  function handleToggleFeatured(id) {
    startTransition(async () => {
      await togglePropertyFeatured(id);
      setProperties((prev) => prev.map((p) => p._id === id ? { ...p, isFeatured: !p.isFeatured } : p));
    });
  }

  function handleDelete(id) {
    setError("");
    startTransition(async () => {
      try {
        await deleteProperty(id);
        setProperties((prev) => prev.filter((p) => p._id !== id));
        setConfirmDelete(null);
      } catch (err) {
        setError(err.message || "Delete failed.");
      }
    });
  }

  const typeStyle = TYPE_STYLE[currentType] ?? null;

  return (
    <div className="space-y-5">

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3">

        {/* Type filter */}
        <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
          {[["", "All"], ["building", "Buildings"], ["cottage", "Cottages"]].map(([v, label]) => (
            <button
              key={v}
              onClick={() => applyFilter({ type: v })}
              className={`px-3.5 py-1.5 rounded-lg text-[11.5px] font-medium transition-all duration-200
                ${currentType === v
                  ? "bg-white/8 text-white shadow-sm"
                  : "text-white/30 hover:text-white/60"
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px] relative flex items-center gap-0">
          <div className="absolute left-3.5 pointer-events-none">
            <SearchIcon />
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search properties…"
            className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl pl-9 pr-4 py-2
              text-[12px] text-white placeholder-white/20 focus:outline-none focus:border-white/20
              transition-colors duration-200"
          />
        </form>

        {/* Summary */}
        <p className="text-[11px] text-white/20 hidden sm:block">
          {total} {total === 1 ? "property" : "properties"}
        </p>
      </div>

      {error && (
        <p className="text-[11.5px] text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl">
          {error}
        </p>
      )}

      {/* ── Grid ── */}
      {properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06]
            flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" className="text-white/15">
              <path d="M3 21V10L12 3l9 7v11" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="9" y="14" width="6" height="7" rx="1" stroke="currentColor" strokeWidth="1.4"/>
            </svg>
          </div>
          <p className="text-[13px] text-white/25">No properties found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {properties.map((prop) => {
            const ts = TYPE_STYLE[prop.type] ?? TYPE_STYLE.building;
            return (
              <div
                key={prop._id}
                className="group bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden
                  hover:border-white/[0.11] transition-all duration-300 flex flex-col"
              >
                {/* Cover image */}
                <div className="relative h-44 bg-[#111] overflow-hidden flex-shrink-0">
                  {prop.coverImage ? (
                    <img
                      src={prop.coverImage}
                      alt={prop.name}
                      className="w-full h-full object-cover group-hover:scale-[1.03]
                        transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <svg viewBox="0 0 40 40" width="36" height="36" fill="none" className="text-white/8">
                        <path d="M5 35V18L20 5l15 13v17" stroke="currentColor" strokeWidth="1.8"
                          strokeLinecap="round" strokeLinejoin="round"/>
                        <rect x="13" y="22" width="14" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                    </div>
                  )}
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent" />

                  {/* Status indicator */}
                  <div className="absolute top-3 left-3">
                    <span className={`inline-flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.18em]
                      font-semibold px-2.5 py-1 rounded-full border backdrop-blur-sm ${ts.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${ts.dot}`} />
                      {ts.label}
                    </span>
                  </div>

                  {/* Badges top-right */}
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                    {prop.isFeatured && (
                      <span className="text-[9px] uppercase tracking-wider font-semibold px-2.5 py-1
                        rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/25 backdrop-blur-sm">
                        ★ Featured
                      </span>
                    )}
                    {!prop.isActive && (
                      <span className="text-[9px] uppercase tracking-wider font-semibold px-2.5 py-1
                        rounded-full bg-white/10 text-white/40 border border-white/15 backdrop-blur-sm">
                        Inactive
                      </span>
                    )}
                  </div>

                  {/* Property name on image bottom */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-[14px] font-semibold text-white leading-snug drop-shadow">
                      {prop.name}
                    </p>
                    {prop.location && (
                      <p className="text-[10.5px] text-white/55 mt-0.5 truncate">
                        {prop.location}
                      </p>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 flex-1 flex flex-col gap-3">

                  {/* Stats row */}
                  <div className="flex items-center gap-4 text-[11px]">
                    {prop.type === "building" ? (
                      <>
                        <span className="text-white/35">
                          <span className="font-semibold text-white/60">{prop.roomStats?.total ?? 0}</span> rooms
                        </span>
                        <span className="text-emerald-400/70">
                          <span className="font-semibold">{prop.roomStats?.available ?? 0}</span> available
                        </span>
                        {(prop.roomStats?.total ?? 0) - (prop.roomStats?.available ?? 0) > 0 && (
                          <span className="text-amber-400/60">
                            <span className="font-semibold">
                              {(prop.roomStats?.total ?? 0) - (prop.roomStats?.available ?? 0)}
                            </span> occupied
                          </span>
                        )}
                      </>
                    ) : (
                      prop.pricePerNight > 0 ? (
                        <span className="text-white/40">
                          <span className="font-semibold text-white/65">
                            ৳{prop.pricePerNight.toLocaleString()}
                          </span>/night
                        </span>
                      ) : (
                        <span className="text-white/25 italic">No pricing set</span>
                      )
                    )}
                    {prop.supportsDayLong && (
                      <span className="text-[9px] uppercase tracking-wider bg-[#7A2267]/15
                        text-[#c05aae] border border-[#7A2267]/25 px-2 py-0.5 rounded-full ml-auto">
                        Day Long
                      </span>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-white/[0.05]" />

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/accommodation/${prop._id}`}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl
                        border border-white/[0.08] text-[11.5px] text-white/45
                        hover:text-white hover:border-[#7A2267]/50 hover:bg-[#7A2267]/8
                        transition-all duration-200 group/btn"
                    >
                      <EditIcon />
                      <span>Manage</span>
                    </Link>

                    {canWrite && (
                      <>
                        <button
                          onClick={() => handleToggleActive(prop._id)}
                          disabled={isPending}
                          title={prop.isActive ? "Deactivate" : "Activate"}
                          className={`w-9 h-9 flex items-center justify-center rounded-xl border
                            transition-all duration-200 disabled:opacity-40
                            ${prop.isActive
                              ? "border-emerald-500/20 text-emerald-400/60 hover:bg-emerald-500/10"
                              : "border-white/[0.07] text-white/25 hover:text-white/50 hover:border-white/15"
                            }`}
                        >
                          <svg viewBox="0 0 14 14" width="13" height="13" fill="none">
                            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"
                              fill={prop.isActive ? "currentColor" : "none"} fillOpacity={prop.isActive ? "0.15" : "0"}/>
                            <path d="M5 7l1.5 1.5L9.5 5.5" stroke="currentColor" strokeWidth="1.4"
                              strokeLinecap="round" strokeLinejoin="round"
                              opacity={prop.isActive ? "1" : "0"}/>
                          </svg>
                        </button>

                        <button
                          onClick={() => setConfirmDelete(prop._id)}
                          title="Delete property"
                          className="w-9 h-9 flex items-center justify-center rounded-xl border
                            border-red-500/10 text-red-400/35 hover:text-red-400
                            hover:border-red-500/30 hover:bg-red-500/8
                            transition-all duration-200"
                        >
                          <TrashIcon />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-2">
          <button
            onClick={() => applyFilter({ page: String(currentPage - 1) })}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30
              hover:text-white/65 hover:bg-white/[0.06] disabled:opacity-30 transition-all duration-200"
          >
            <svg viewBox="0 0 8 12" width="7" height="11" fill="none">
              <path d="M6 10L2 6l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => applyFilter({ page: String(p) })}
              className={`w-8 h-8 rounded-lg text-[12px] font-medium transition-all duration-200
                ${p === currentPage
                  ? "bg-[#7A2267] text-white shadow-md shadow-[#7A2267]/20"
                  : "text-white/30 hover:text-white/65 hover:bg-white/[0.06]"
                }`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => applyFilter({ page: String(currentPage + 1) })}
            disabled={currentPage === pages}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30
              hover:text-white/65 hover:bg-white/[0.06] disabled:opacity-30 transition-all duration-200"
          >
            <svg viewBox="0 0 8 12" width="7" height="11" fill="none">
              <path d="M2 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* ── Delete confirm modal ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/[0.08] rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20
                flex items-center justify-center shrink-0">
                <TrashIcon />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-white/85">Delete this property?</p>
                <p className="text-[12px] text-white/35 mt-1 leading-relaxed">
                  This permanently removes the property and all its categories and rooms. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[12.5px] font-semibold
                  hover:bg-red-600 disabled:opacity-50 transition-colors duration-200"
              >
                {isPending ? "Deleting…" : "Yes, Delete"}
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-white/40 text-[12.5px]
                  hover:text-white/65 hover:border-white/15 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
