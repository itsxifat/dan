"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const ROOM_STATUS_DOT = {
  available:   "bg-emerald-500",
  occupied:    "bg-amber-400",
  maintenance: "bg-orange-400",
  blocked:     "bg-red-400",
};

const SORT_OPTIONS = [
  { value: "price_asc",  label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "variant",    label: "By Room Type" },
  { value: "bedtype",    label: "By Bed Type" },
  { value: "floor_asc",  label: "Floor: Low → High" },
];

// Helper: effective price for a room
function roomEffectivePrice(room, categoryPrice) {
  if (room.pricePerNight > 0) return room.pricePerNight;
  if (room.variant?.pricePerNight > 0) return room.variant.pricePerNight;
  return categoryPrice ?? 0;
}

export default function CategoryRoomsGrid({ rooms, category }) {
  const [sortBy,          setSortBy]          = useState("price_asc");
  const [filterVariantId, setFilterVariantId] = useState("all");
  const [filterBedType,   setFilterBedType]   = useState("all");

  const categoryPrice = category?.pricePerNight ?? 0;

  // Derive unique variants & bed types for filter chips
  const variantOptions = useMemo(() => {
    const seen = new Map();
    for (const r of rooms) {
      if (r.variant && !seen.has(String(r.variant._id))) {
        seen.set(String(r.variant._id), r.variant.name);
      }
    }
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [rooms]);

  const bedTypeOptions = useMemo(() => {
    const seen = new Set();
    for (const r of rooms) {
      const bt = r.variant?.bedType ?? category?.bedType;
      if (bt) seen.add(bt);
    }
    return [...seen];
  }, [rooms, category]);

  // Filter + sort
  const processed = useMemo(() => {
    let list = [...rooms];

    // Available rooms first (always)
    list = list.filter((r) => r.status === "available");

    // Variant filter
    if (filterVariantId !== "all") {
      list = list.filter((r) => r.variant && String(r.variant._id) === filterVariantId);
    }

    // Bed type filter
    if (filterBedType !== "all") {
      list = list.filter((r) => (r.variant?.bedType ?? category?.bedType) === filterBedType);
    }

    // Sort
    if (sortBy === "price_asc") {
      list.sort((a, b) => roomEffectivePrice(a, categoryPrice) - roomEffectivePrice(b, categoryPrice));
    } else if (sortBy === "price_desc") {
      list.sort((a, b) => roomEffectivePrice(b, categoryPrice) - roomEffectivePrice(a, categoryPrice));
    } else if (sortBy === "variant") {
      list.sort((a, b) => (a.variant?.name ?? "").localeCompare(b.variant?.name ?? ""));
    } else if (sortBy === "bedtype") {
      list.sort((a, b) => (a.variant?.bedType ?? "").localeCompare(b.variant?.bedType ?? ""));
    } else if (sortBy === "floor_asc") {
      list.sort((a, b) => (a.floor ?? 0) - (b.floor ?? 0));
    }

    return list;
  }, [rooms, sortBy, filterVariantId, filterBedType, categoryPrice, category]);

  // For "By Room Type" and "By Bed Type" sort: group rooms
  const grouped = useMemo(() => {
    if (sortBy !== "variant" && sortBy !== "bedtype") return null;

    const groups = {};
    for (const room of processed) {
      const key = sortBy === "variant"
        ? (room.variant?.name ?? "No Type")
        : (room.variant?.bedType ?? category?.bedType ?? "Other");
      if (!groups[key]) groups[key] = [];
      groups[key].push(room);
    }
    return groups;
  }, [processed, sortBy, category]);

  // For price/floor sort: group by block → floor → row
  const blockGroups = useMemo(() => {
    if (sortBy === "variant" || sortBy === "bedtype") return null;
    const hasBlocks = processed.some((r) => r.block);
    const hasRows   = processed.some((r) => r.row);
    const g = {};
    for (const room of processed) {
      const bk = room.block || (hasBlocks ? "Other" : "");
      const fk = String(room.floor ?? "");
      const rk = room.row || "";
      if (!g[bk])     g[bk] = {};
      if (!g[bk][fk]) g[bk][fk] = {};
      if (!g[bk][fk][rk]) g[bk][fk][rk] = [];
      g[bk][fk][rk].push(room);
    }
    return { groups: g, hasBlocks, hasRows };
  }, [processed, sortBy]);

  const totalAvailable = rooms.filter((r) => r.status === "available").length;

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <h3 className="text-[15px] font-bold text-neutral-800 shrink-0">
          Room Availability
          <span className="ml-2 text-[12px] font-normal text-neutral-400">
            {processed.length} of {totalAvailable} shown
          </span>
        </h3>

        <div className="flex flex-wrap gap-2 sm:ml-auto">
          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-[11.5px] text-neutral-600 bg-white border border-neutral-200 rounded-lg px-3 py-1.5
              focus:outline-none focus:border-[#7A2267]/40 cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Variant filter chips */}
          {variantOptions.length > 1 && (
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setFilterVariantId("all")}
                className={`text-[10.5px] px-2.5 py-1 rounded-full border transition-colors
                  ${filterVariantId === "all"
                    ? "bg-[#7A2267] text-white border-[#7A2267]"
                    : "bg-white text-neutral-500 border-neutral-200 hover:border-[#7A2267]/40"
                  }`}
              >
                All Types
              </button>
              {variantOptions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setFilterVariantId(filterVariantId === v.id ? "all" : v.id)}
                  className={`text-[10.5px] px-2.5 py-1 rounded-full border transition-colors
                    ${filterVariantId === v.id
                      ? "bg-[#7A2267] text-white border-[#7A2267]"
                      : "bg-white text-neutral-500 border-neutral-200 hover:border-[#7A2267]/40"
                    }`}
                >
                  {v.name}
                </button>
              ))}
            </div>
          )}

          {/* Bed type filter chips */}
          {bedTypeOptions.length > 1 && (
            <div className="flex gap-1.5 flex-wrap">
              {filterBedType !== "all" && (
                <button
                  onClick={() => setFilterBedType("all")}
                  className="text-[10.5px] px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200 hover:bg-neutral-200 transition-colors"
                >
                  All Beds ×
                </button>
              )}
              {bedTypeOptions.map((bt) => (
                <button
                  key={bt}
                  onClick={() => setFilterBedType(filterBedType === bt ? "all" : bt)}
                  className={`text-[10.5px] px-2.5 py-1 rounded-full border transition-colors
                    ${filterBedType === bt
                      ? "bg-[#7A2267]/10 text-[#7A2267] border-[#7A2267]/30"
                      : "bg-white text-neutral-500 border-neutral-200 hover:border-[#7A2267]/40"
                    }`}
                >
                  {bt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {processed.length === 0 ? (
        <p className="text-[13px] text-neutral-400 py-6 text-center">No available rooms match your filters.</p>
      ) : grouped ? (
        /* ── Grouped by variant or bed type ── */
        <div className="space-y-6">
          {Object.entries(grouped).map(([groupKey, groupRooms]) => (
            <div key={groupKey}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[#7A2267] bg-[#7A2267]/8 border border-[#7A2267]/20 px-3 py-1 rounded-full">
                  {groupKey}
                </span>
                <div className="flex-1 h-px bg-neutral-100" />
                <span className="text-[10.5px] text-neutral-400">{groupRooms.length} room{groupRooms.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {groupRooms.map((room) => (
                  <RoomCard key={room._id} room={room} categoryPrice={categoryPrice} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : blockGroups ? (
        /* ── Grouped by block → floor → row ── */
        <div className="space-y-6">
          {Object.keys(blockGroups.groups).map((block) => (
            <div key={block}>
              {blockGroups.hasBlocks && block && (
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[#7A2267] bg-[#7A2267]/8 border border-[#7A2267]/20 px-3 py-1 rounded-full">
                    {block}
                  </span>
                  <div className="flex-1 h-px bg-neutral-100" />
                </div>
              )}
              {Object.keys(blockGroups.groups[block]).sort((a, b) => Number(a) - Number(b)).map((floor) => (
                <div key={floor} className="mb-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-400 font-semibold mb-2 flex items-center gap-2">
                    <span>Floor {floor}</span>
                    <span className="flex-1 h-px bg-neutral-100 inline-block" />
                  </p>
                  {Object.keys(blockGroups.groups[block][floor]).map((rowKey) => (
                    <div key={rowKey} className="mb-3">
                      {blockGroups.hasRows && rowKey && (
                        <p className="text-[9.5px] uppercase tracking-wider text-neutral-300 font-medium mb-1.5 ml-0.5">
                          {rowKey}
                        </p>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {blockGroups.groups[block][floor][rowKey].map((room) => (
                          <RoomCard key={room._id} room={room} categoryPrice={categoryPrice} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RoomCard({ room, categoryPrice }) {
  const price = roomEffectivePrice(room, categoryPrice);
  const isOverride = room.pricePerNight > 0;

  return (
    <Link
      href={`/rooms/${room._id}`}
      className="group p-3 rounded-xl border text-center transition-all duration-200 block
        bg-white border-neutral-200 hover:border-[#7A2267]/40 hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-center gap-1.5 mb-1">
        <div className={`w-1.5 h-1.5 rounded-full ${ROOM_STATUS_DOT[room.status]}`} />
        <span className="text-[13px] font-semibold text-neutral-700 font-mono group-hover:text-[#7A2267] transition-colors">
          {room.roomNumber}
        </span>
      </div>
      {room.variant && (
        <p className="text-[9.5px] text-[#7A2267]/70 truncate px-0.5 leading-none mb-0.5">{room.variant.name}</p>
      )}
      {room.variant?.bedType && (
        <p className="text-[9px] text-neutral-400 truncate px-0.5 leading-none mb-0.5">{room.variant.bedType}</p>
      )}
      {price > 0 && (
        <p className={`text-[10.5px] font-semibold ${isOverride ? "text-[#7A2267]" : "text-neutral-600"}`}>
          ৳{price.toLocaleString()}
          {isOverride && <span className="text-[8px] ml-0.5 opacity-70">*</span>}
        </p>
      )}
      {room.facing && (
        <p className="text-[9.5px] text-neutral-400 truncate px-0.5 mt-0.5">{room.facing}</p>
      )}
      <p className="text-[10px] uppercase tracking-wide mt-0.5 font-medium text-emerald-600">
        {room.status}
      </p>
      <p className="text-[9.5px] text-[#7A2267] mt-1 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
        View →
      </p>
    </Link>
  );
}
