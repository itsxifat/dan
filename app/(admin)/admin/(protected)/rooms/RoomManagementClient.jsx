"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { CustomSelect } from "./RoomUIComponents";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  available:   { label: "Available",   dot: "bg-emerald-400", text: "text-emerald-400", border: "border-l-emerald-500",  pill: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  occupied:    { label: "Occupied",    dot: "bg-blue-400",    text: "text-blue-400",    border: "border-l-blue-500",     pill: "bg-blue-500/10 text-blue-400 border-blue-500/20"         },
  maintenance: { label: "Maintenance", dot: "bg-amber-400",   text: "text-amber-400",   border: "border-l-amber-500",    pill: "bg-amber-500/10 text-amber-400 border-amber-500/20"      },
  blocked:     { label: "Blocked",     dot: "bg-red-500",     text: "text-red-400",     border: "border-l-red-600",      pill: "bg-red-500/10 text-red-400 border-red-500/20"            },
};

const STAT_META = {
  total:       { icon: "grid",   color: "text-white/70",    accent: "bg-white/3"         },
  available:   { icon: "check",  color: "text-emerald-400", accent: "bg-emerald-500/[0.04]" },
  occupied:    { icon: "person", color: "text-blue-400",    accent: "bg-blue-500/[0.04]"   },
  maintenance: { icon: "wrench", color: "text-amber-400",   accent: "bg-amber-500/[0.04]"  },
  blocked:     { icon: "lock",   color: "text-red-400",     accent: "bg-red-500/[0.04]"    },
  arrivals:    { icon: "down",   color: "text-emerald-300", accent: "bg-emerald-500/[0.03]"},
  departures:  { icon: "up",     color: "text-amber-300",   accent: "bg-amber-500/[0.03]"  },
};

function fmt(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

// ─── Stat icon ────────────────────────────────────────────────────────────────
function StatIcon({ type }) {
  const icons = {
    grid: (
      <svg viewBox="0 0 14 14" width="13" height="13" fill="none">
        <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.15"/>
        <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.15"/>
        <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.15"/>
        <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.15"/>
      </svg>
    ),
    check: (
      <svg viewBox="0 0 14 14" width="13" height="13" fill="none">
        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.12"/>
        <path d="M4.5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    person: (
      <svg viewBox="0 0 14 14" width="13" height="13" fill="none">
        <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.12"/>
        <path d="M1.5 13c0-3.038 2.462-5.5 5.5-5.5s5.5 2.462 5.5 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
    wrench: (
      <svg viewBox="0 0 14 14" width="13" height="13" fill="none">
        <path d="M9.5 1.5a3 3 0 0 0-3 4.5L1.5 11a1.5 1.5 0 0 0 2 2l5-5a3 3 0 0 0 4.5-3 3 3 0 0 0-.5-1.5L11 5l-2-2 1.5-1.5a3 3 0 0 0-1-.5z"
          stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="currentColor" fillOpacity="0.12"/>
      </svg>
    ),
    lock: (
      <svg viewBox="0 0 14 14" width="13" height="13" fill="none">
        <rect x="2.5" y="6" width="9" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.12"/>
        <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        <circle cx="7" cy="9.5" r="1" fill="currentColor"/>
      </svg>
    ),
    down: (
      <svg viewBox="0 0 14 14" width="13" height="13" fill="none">
        <path d="M7 2v9M3.5 8l3.5 4 3.5-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    up: (
      <svg viewBox="0 0 14 14" width="13" height="13" fill="none">
        <path d="M7 12V3M3.5 6L7 2l3.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  };
  return icons[type] || null;
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ id, label, value, sub }) {
  const meta = STAT_META[id] || STAT_META.total;
  return (
    <div className={`relative overflow-hidden rounded-xl border border-white/6
      px-4 py-3.5 flex flex-col gap-2 ${meta.accent}`}>
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/28">
          {label}
        </span>
        <span className={meta.color}>
          <StatIcon type={meta.icon} />
        </span>
      </div>
      <div className="flex items-end gap-1.5">
        <span className={`text-[26px] font-bold leading-none tracking-tight ${meta.color}`}>
          {value}
        </span>
        {sub && <span className="text-[10px] text-white/25 mb-0.5 font-medium">{sub}</span>}
      </div>
    </div>
  );
}

// ─── Room card ────────────────────────────────────────────────────────────────
function RoomCard({ room }) {
  const status    = room.status || "available";
  const cfg       = STATUS_CONFIG[status] || STATUS_CONFIG.available;
  const conflict  = room._hasConflict;
  const booking   = room._activeBooking;
  const offline   = room._activeOffline;
  const guestName = booking?.primaryGuest?.name || offline?.primaryGuest?.name || null;
  const checkOut  = booking?.checkOut || offline?.checkOut;
  const isOfflineOnly = offline && !booking;

  return (
    <Link
      href={`/admin/rooms/${room._id}`}
      className={[
        "group flex flex-col gap-1.5 p-3 rounded-xl",
        "border-l-[3px] border border-white/6",
        // Minimal hover — no transforms that cause blur
        "transition-colors duration-150",
        "hover:bg-white/4 hover:border-white/10",
        conflict ? "border-l-orange-500 bg-orange-500/[0.04]" : cfg.border,
      ].join(" ")}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-[1px]
            ${conflict ? "bg-orange-400" : cfg.dot}`} />
          <span className="text-[12px] font-bold text-white/85 leading-none">
            {room.roomNumber}
          </span>
        </div>
        <div className="flex gap-1">
          {conflict && (
            <span className="text-[7.5px] font-bold uppercase tracking-wider
              text-orange-400 bg-orange-500/15 border border-orange-500/25
              px-1.5 py-0.5 rounded-full leading-none">⚠ Conflict</span>
          )}
          {isOfflineOnly && (
            <span className="text-[7.5px] font-bold uppercase tracking-wider
              text-amber-400 bg-amber-500/12 border border-amber-500/20
              px-1.5 py-0.5 rounded-full leading-none">Offline</span>
          )}
        </div>
      </div>

      {/* Category + floor */}
      <p className="text-[10px] text-white/35 leading-none truncate">
        {room.category?.name || "—"}
        <span className="opacity-40 mx-1">·</span>
        F{room.floor}
        {room.block ? <><span className="opacity-40 mx-1">·</span>B{room.block}</> : ""}
      </p>

      {/* Guest / empty */}
      {guestName ? (
        <div className="mt-0.5">
          <p className="text-[11px] text-white/75 font-medium leading-none truncate">{guestName}</p>
          {checkOut && <p className="text-[9.5px] text-white/30 mt-0.5">until {fmt(checkOut)}</p>}
        </div>
      ) : (
        <p className={`text-[10px] mt-0.5 ${status === "available"
          ? "text-white/22 italic"
          : cfg.text + " opacity-70"}`}>
          {status === "available" ? "Vacant" : STATUS_CONFIG[status]?.label}
        </p>
      )}

      {/* Today indicators */}
      {room._todayCheckIn && (
        <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400 font-semibold mt-0.5">
          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
          Arriving today
        </span>
      )}
      {room._todayCheckOut && !room._todayCheckIn && (
        <span className="inline-flex items-center gap-1 text-[9px] text-amber-400 font-semibold mt-0.5">
          <span className="w-1 h-1 rounded-full bg-amber-400" />
          Departing today
        </span>
      )}
    </Link>
  );
}

// ─── Movement row ─────────────────────────────────────────────────────────────
function MovementRow({ item, type }) {
  const isArrival = type === "arrival";
  return (
    <div className="flex items-center gap-2.5 py-2.5 border-b border-white/5 last:border-0">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px]
        ${isArrival ? "bg-emerald-500/12 text-emerald-400" : "bg-amber-500/12 text-amber-400"}`}>
        {isArrival ? "↓" : "↑"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-white/75 truncate leading-none">
          {item.guest?.name || "Guest"}
        </p>
        <p className="text-[9.5px] text-white/30 mt-0.5">
          Rm {item.room?.roomNumber || "?"}
          <span className="mx-1 opacity-40">·</span>
          {item.source === "offline" ? item.referenceNumber : item.bookingNumber}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[10px] font-medium text-white/50">
          {fmt(isArrival ? item.checkIn : item.checkOut)}
        </p>
        {item.source === "offline" && item.remainingAmount > 0 && (
          <p className="text-[9px] text-orange-400 mt-0.5">৳{item.remainingAmount?.toLocaleString()} due</p>
        )}
        {item.source === "online" && (
          <span className="text-[8px] text-blue-400/70 font-medium">Online</span>
        )}
      </div>
    </div>
  );
}

// ─── Filter pill ──────────────────────────────────────────────────────────────
function FilterPill({ label, count, active, dot, onClick }) {
  return (
    <button onClick={onClick}
      className={[
        "flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg",
        "text-[11px] transition-colors duration-150 border",
        active
          ? "bg-[#7A2267]/18 text-[#c05aae] border-[#7A2267]/30"
          : "text-white/38 hover:text-white/65 hover:bg-white/4 border-transparent",
      ].join(" ")}>
      <span className="flex items-center gap-2">
        {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />}
        {label}
      </span>
      <span className="text-[9.5px] opacity-50 tabular-nums">{count}</span>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function RoomManagementClient({
  initialRooms, stats, arrivals, departures,
  properties, selectedProperty, selectedStatus,
  selectedFloor, selectedBlock, selectedCategory, canWrite,
}) {
  const router   = useRouter();
  const pathname = usePathname();
  const [view, setView]     = useState("grid");
  const [search, setSearch] = useState("");

  const floors = [...new Set(initialRooms.map((r) => r.floor).filter((f) => f !== undefined && f !== null))]
    .sort((a, b) => a - b);
  const blocks = [...new Set(initialRooms.map((r) => r.block).filter(Boolean))].sort();

  function applyFilter(key, value) {
    const current = {
      ...(selectedProperty && { property: selectedProperty }),
      ...(selectedStatus   && { status:   selectedStatus   }),
      ...(selectedFloor    && { floor:    selectedFloor    }),
      ...(selectedBlock    && { block:    selectedBlock    }),
      ...(selectedCategory && { category: selectedCategory }),
    };
    const next = { ...current, [key]: value };
    if (!value) delete next[key];
    router.push(`${pathname}?${new URLSearchParams(next).toString()}`);
  }

  const filtered = initialRooms.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.roomNumber?.toLowerCase().includes(q) ||
      r.category?.name?.toLowerCase().includes(q) ||
      r._activeBooking?.primaryGuest?.name?.toLowerCase().includes(q) ||
      r._activeOffline?.primaryGuest?.name?.toLowerCase().includes(q)
    );
  });

  const byFloor = {};
  for (const room of filtered) {
    const f = room.floor ?? 0;
    if (!byFloor[f]) byFloor[f] = [];
    byFloor[f].push(room);
  }
  const sortedFloors = Object.keys(byFloor).sort((a, b) => Number(a) - Number(b));
  const conflictCount = filtered.filter((r) => r._hasConflict).length;

  const propertyOpts = [
    { value: "", label: "All Properties" },
    ...(properties || []).map((p) => ({ value: p._id, label: p.name })),
  ];
  const floorOpts = [
    { value: "", label: "All Floors" },
    ...floors.map((f) => ({ value: String(f), label: `Floor ${f}` })),
  ];
  const blockOpts = [
    { value: "", label: "All Blocks" },
    ...blocks.map((b) => ({ value: b, label: `Block ${b}` })),
  ];
  const statusCounts = {
    "":          filtered.length,
    available:   filtered.filter((r) => r.status === "available").length,
    occupied:    filtered.filter((r) => r.status === "occupied").length,
    maintenance: filtered.filter((r) => r.status === "maintenance").length,
    blocked:     filtered.filter((r) => r.status === "blocked").length,
  };

  return (
    <div className="space-y-5">

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        <StatCard id="total"       label="Total"       value={stats.total}          />
        <StatCard id="available"   label="Available"   value={stats.available}      />
        <StatCard id="occupied"    label="Occupied"    value={stats.occupied}       />
        <StatCard id="maintenance" label="Maintenance" value={stats.maintenance}    />
        <StatCard id="blocked"     label="Blocked"     value={stats.blocked}        />
        <StatCard id="arrivals"    label="Arrivals"    value={stats.todayCheckIns}  sub="today" />
        <StatCard id="departures"  label="Departures"  value={stats.todayCheckOuts} sub="today" />
      </div>

      {/* Conflict banner */}
      {conflictCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl
          bg-orange-500/8 border border-orange-500/25 text-[11.5px]">
          <span className="flex items-center justify-center w-6 h-6 rounded-full
            bg-orange-500/20 text-orange-400 shrink-0 text-[11px] font-bold">!</span>
          <span className="text-orange-300 font-medium">
            {conflictCount} room{conflictCount > 1 ? "s have" : " has"} overlapping online &amp; offline bookings.
          </span>
          <span className="ml-auto text-[10px] text-orange-400/50 hidden sm:block">
            Click a room to resolve
          </span>
        </div>
      )}

      <div className="flex gap-5 items-start">

        {/* ── LEFT: Filters ─────────────────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col gap-4 w-[168px] flex-shrink-0">

          <div className="flex items-center justify-between">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/22">Filters</p>
            {(selectedStatus || selectedFloor || selectedBlock || selectedProperty) && (
              <button onClick={() => router.push(pathname)}
                className="text-[9px] text-white/28 hover:text-white/60 transition-colors">
                Clear all
              </button>
            )}
          </div>

          {propertyOpts.length > 2 && (
            <div className="space-y-1.5">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-white/22 px-0.5">Property</p>
              <CustomSelect fullWidth value={selectedProperty}
                onChange={(v) => applyFilter("property", v)} options={propertyOpts} />
            </div>
          )}

          <div className="space-y-1">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-white/22 px-0.5">Status</p>
            <div className="space-y-0.5">
              <FilterPill label="All" count={statusCounts[""]}
                active={!selectedStatus} onClick={() => applyFilter("status", "")} />
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <FilterPill key={key} label={cfg.label} count={statusCounts[key] || 0}
                  dot={cfg.dot} active={selectedStatus === key}
                  onClick={() => applyFilter("status", selectedStatus === key ? "" : key)} />
              ))}
            </div>
          </div>

          {floors.length > 1 && (
            <div className="space-y-1.5">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-white/22 px-0.5">Floor</p>
              <CustomSelect fullWidth value={selectedFloor}
                onChange={(v) => applyFilter("floor", v)} options={floorOpts} />
            </div>
          )}

          {blocks.length > 1 && (
            <div className="space-y-1.5">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-white/22 px-0.5">Block</p>
              <CustomSelect fullWidth value={selectedBlock}
                onChange={(v) => applyFilter("block", v)} options={blockOpts} />
            </div>
          )}

          {/* Legend */}
          <div className="pt-3 border-t border-white/5 space-y-2">
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/18">Legend</p>
            {[
              ...Object.entries(STATUS_CONFIG).map(([, c]) => ({ dot: c.dot, label: c.label })),
              { dot: "bg-orange-400", label: "Conflict" },
              { dot: "bg-amber-400",  label: "Offline booked" },
            ].map(({ dot, label }) => (
              <div key={label} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                <span className="text-[10px] text-white/35">{label}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* ── MIDDLE: Room grid ──────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Toolbar */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative flex-1 min-w-45">
              <svg viewBox="0 0 14 14" width="12" height="12" fill="none"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/22 pointer-events-none">
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M9.5 9.5l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <input type="text" placeholder="Search room, guest…" value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/4 border border-white/8 rounded-xl pl-8 pr-3 py-2
                  text-[12px] text-white/75 outline-none placeholder:text-white/22
                  focus:border-[#7A2267]/50 focus:bg-white/[0.05] transition-all" />
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                    text-white/25 hover:text-white/60 text-[10px] transition-colors">✕</button>
              )}
            </div>

            {/* View toggle */}
            <div className="flex bg-white/4 border border-white/8 rounded-xl overflow-hidden p-0.5">
              {[
                { v: "grid", icon: (
                  <svg viewBox="0 0 14 14" width="13" height="13" fill="none">
                    <rect x="1" y="1" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.18"/>
                    <rect x="8" y="1" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.18"/>
                    <rect x="1" y="8" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.18"/>
                    <rect x="8" y="8" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.18"/>
                  </svg>
                )},
                { v: "list", icon: (
                  <svg viewBox="0 0 14 14" width="13" height="13" fill="none">
                    <path d="M1 3.5h12M1 7h12M1 10.5h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                )},
              ].map(({ v, icon }) => (
                <button key={v} onClick={() => setView(v)}
                  className={[
                    "px-2.5 py-1.5 rounded-lg transition-all duration-150",
                    view === v ? "bg-white/10 text-white/85 shadow-sm" : "text-white/28 hover:text-white/60",
                  ].join(" ")}>
                  {icon}
                </button>
              ))}
            </div>

            <span className="text-[10px] text-white/22 font-medium tabular-nums">
              {filtered.length} room{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Content */}
          {filtered.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-[13px] text-white/22">No rooms match your filters</p>
              <button onClick={() => { setSearch(""); router.push(pathname); }}
                className="mt-3 text-[11px] text-[#c05aae] hover:underline">Clear filters</button>
            </div>

          ) : view === "grid" ? (
            <div className="space-y-7">
              {sortedFloors.map((floor) => (
                <div key={floor}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/22">
                      Floor {floor === "0" ? "G" : floor}
                    </span>
                    <span className="text-[9px] text-white/14 tabular-nums">({byFloor[floor].length})</span>
                    <div className="flex-1 h-px bg-white/5" />
                    <div className="flex items-center gap-2">
                      {["available","occupied","maintenance","blocked"].map((s) => {
                        const cnt = byFloor[floor].filter((r) => r.status === s).length;
                        if (!cnt) return null;
                        return (
                          <span key={s} className="flex items-center gap-1 text-[9px] text-white/28">
                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[s].dot}`} />
                            {cnt}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2">
                    {byFloor[floor].map((room) => <RoomCard key={room._id} room={room} />)}
                  </div>
                </div>
              ))}
            </div>

          ) : (
            <div className="rounded-xl border border-white/[0.07] overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-white/[0.07] bg-white/2.5">
                    {["Room","Floor / Block","Category","Status","Guest","Check-In","Check-Out",""].map((h) => (
                      <th key={h} className="px-3.5 py-3 text-left text-[9px] uppercase
                        tracking-[0.12em] text-white/25 font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((room) => {
                    const cfg     = STATUS_CONFIG[room.status] || STATUS_CONFIG.available;
                    const booking = room._activeBooking;
                    const offline = room._activeOffline;
                    const guest   = booking?.primaryGuest?.name || offline?.primaryGuest?.name || "—";
                    const checkIn  = booking?.checkIn  || offline?.checkIn;
                    const checkOut = booking?.checkOut || offline?.checkOut;
                    return (
                      <tr key={room._id} className={[
                        "border-b border-white/4 transition-colors hover:bg-white/3",
                        room._hasConflict ? "bg-orange-500/[0.04]" : "",
                      ].join(" ")}>
                        <td className="px-3.5 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0
                              ${room._hasConflict ? "bg-orange-400" : cfg.dot}`} />
                            <span className="font-semibold text-white/80">{room.roomNumber}</span>
                            {room._hasConflict && (
                              <span className="text-[7.5px] text-orange-400 font-bold uppercase">Conflict</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5 text-white/38">
                          {room.floor}{room.block && <span className="ml-1.5">/ {room.block}</span>}
                        </td>
                        <td className="px-3.5 py-2.5 text-white/50">{room.category?.name || "—"}</td>
                        <td className="px-3.5 py-2.5">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5
                            rounded-full text-[9.5px] font-medium border ${cfg.pill}`}>
                            <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-white/65 max-w-[120px] truncate">{guest}</td>
                        <td className="px-3.5 py-2.5 text-white/35">{fmt(checkIn)}</td>
                        <td className="px-3.5 py-2.5 text-white/35">{fmt(checkOut)}</td>
                        <td className="px-3.5 py-2.5">
                          <Link href={`/admin/rooms/${room._id}`}
                            className="text-[10px] font-medium text-[#c05aae]/70 hover:text-[#c05aae] transition-colors">
                            Open →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── RIGHT: Today's movements ───────────────────────────────────── */}
        <aside className="hidden xl:flex flex-col gap-3 w-52 flex-shrink-0">

          {/* Arrivals */}
          <div className="bg-white/2 border border-white/6 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-white/5">
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/22">Arrivals</span>
              <span className="ml-auto text-[12px] font-bold text-emerald-400 tabular-nums">{arrivals.length}</span>
            </div>
            <div className="px-3.5">
              {arrivals.length === 0
                ? <p className="text-[11px] text-white/18 py-3 text-center">No arrivals today</p>
                : arrivals.map((a) => <MovementRow key={a._id} item={a} type="arrival" />)}
            </div>
          </div>

          {/* Departures */}
          <div className="bg-white/2 border border-white/6 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-white/5">
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/22">Departures</span>
              <span className="ml-auto text-[12px] font-bold text-amber-400 tabular-nums">{departures.length}</span>
            </div>
            <div className="px-3.5">
              {departures.length === 0
                ? <p className="text-[11px] text-white/18 py-3 text-center">No departures today</p>
                : departures.map((d) => <MovementRow key={d._id} item={d} type="departure" />)}
            </div>
          </div>

          {/* Occupancy rate */}
          <div className="bg-white/2 border border-white/6 rounded-xl p-3.5 space-y-2.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/22">Occupancy Rate</p>
            <div className="flex items-end gap-1.5">
              <span className="text-[28px] font-bold leading-none text-white/80">{stats.occupancyRate ?? 0}</span>
              <span className="text-[13px] text-white/30 mb-0.5">%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-[#7A2267] to-[#c05aae] transition-all duration-500"
                style={{ width: `${stats.occupancyRate ?? 0}%` }} />
            </div>
            <div className="flex justify-between text-[9px] text-white/22">
              <span>{stats.occupied} occupied</span>
              <span>{stats.available} free</span>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
