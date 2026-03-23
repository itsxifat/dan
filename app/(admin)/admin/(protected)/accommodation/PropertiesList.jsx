"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  deleteProperty,
  togglePropertyActive,
  togglePropertyFeatured,
} from "@/actions/accommodation/propertyActions";

const TYPE_BADGE = {
  building: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  cottage:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export default function PropertiesList({
  initialProperties, total, pages, currentPage, currentType, currentSearch, canWrite,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const qs = useSearchParams();

  const [properties, setProperties] = useState(initialProperties);
  const [search, setSearch] = useState(currentSearch);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

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
      setProperties((prev) =>
        prev.map((p) => p._id === id ? { ...p, isActive: !p.isActive } : p)
      );
    });
  }

  function handleToggleFeatured(id) {
    startTransition(async () => {
      await togglePropertyFeatured(id);
      setProperties((prev) =>
        prev.map((p) => p._id === id ? { ...p, isFeatured: !p.isFeatured } : p)
      );
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

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Type filter */}
        <div className="flex gap-1.5 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
          {[["", "All"], ["building", "Buildings"], ["cottage", "Cottages"]].map(([v, label]) => (
            <button
              key={v}
              onClick={() => applyFilter({ type: v })}
              className={`px-3.5 py-1.5 rounded-lg text-[11.5px] font-medium transition-all duration-200
                ${currentType === v
                  ? "bg-white/8 text-white"
                  : "text-white/30 hover:text-white/60"
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px] flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or location…"
            className="flex-1 bg-white/[0.03] border border-white/[0.07] rounded-xl px-3.5 py-2
              text-[12px] text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors"
          />
          <button type="submit" className="px-4 py-2 rounded-xl bg-white/[0.06] text-white/50 text-[12px]
            hover:bg-white/[0.09] hover:text-white/75 transition-all duration-200">
            Search
          </button>
        </form>
      </div>

      {error && (
        <p className="text-[11.5px] text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl">
          {error}
        </p>
      )}

      {/* Grid */}
      {properties.length === 0 ? (
        <div className="text-center py-20 text-white/20 text-[14px]">
          No properties found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {properties.map((prop) => (
            <div key={prop._id} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden
              hover:border-white/10 transition-colors duration-300 group">

              {/* Cover */}
              <div className="relative h-36 bg-white/[0.04] overflow-hidden">
                {prop.coverImage ? (
                  <img
                    src={prop.coverImage}
                    alt={prop.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white/10">
                    <svg viewBox="0 0 32 32" width="32" height="32" fill="none">
                      <path d="M4 28V14L16 4l12 10v14" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
                  <span className={`text-[9.5px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full border ${TYPE_BADGE[prop.type]}`}>
                    {prop.type}
                  </span>
                  {prop.isFeatured && (
                    <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full
                      bg-amber-400/15 text-amber-400 border border-amber-400/25">
                      Featured
                    </span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white/80 truncate">{prop.name}</p>
                    {prop.location && (
                      <p className="text-[11px] text-white/30 mt-0.5 truncate">{prop.location}</p>
                    )}
                  </div>
                  <div className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${prop.isActive ? "bg-emerald-400" : "bg-white/20"}`} />
                </div>

                {/* Stats */}
                {prop.type === "building" && (
                  <div className="mt-3 flex gap-3 text-[11px] text-white/30">
                    <span>{prop.roomStats?.total ?? 0} rooms</span>
                    <span className="text-emerald-400/70">{prop.roomStats?.available ?? 0} available</span>
                  </div>
                )}
                {prop.type === "cottage" && prop.pricePerNight > 0 && (
                  <p className="mt-3 text-[11px] text-white/30">৳{prop.pricePerNight.toLocaleString()}/night</p>
                )}

                {/* Actions */}
                {canWrite && (
                  <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/admin/accommodation/${prop._id}`}
                      className="flex-1 text-center py-1.5 rounded-lg border border-white/[0.08] text-[11px]
                        text-white/40 hover:text-white/70 hover:border-white/15 transition-all duration-200"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleToggleActive(prop._id)}
                      disabled={isPending}
                      className={`py-1.5 px-3 rounded-lg border text-[11px] transition-all duration-200 disabled:opacity-50
                        ${prop.isActive
                          ? "border-emerald-500/20 text-emerald-400/70 hover:bg-emerald-500/10"
                          : "border-white/[0.08] text-white/30 hover:text-white/55"
                        }`}
                    >
                      {prop.isActive ? "Active" : "Inactive"}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(prop._id)}
                      className="py-1.5 px-3 rounded-lg border border-red-500/10 text-[11px]
                        text-red-400/40 hover:text-red-400 hover:border-red-500/30 transition-all duration-200"
                    >
                      Del
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
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

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/[0.08] rounded-2xl p-6 max-w-sm w-full space-y-4">
            <p className="text-[14px] font-semibold text-white/85">Delete this property?</p>
            <p className="text-[12px] text-white/40">
              This will permanently delete the property along with all its categories and rooms.
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[12.5px] font-semibold
                  hover:bg-red-600 disabled:opacity-50 transition-colors duration-200"
              >
                {isPending ? "Deleting…" : "Delete"}
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
