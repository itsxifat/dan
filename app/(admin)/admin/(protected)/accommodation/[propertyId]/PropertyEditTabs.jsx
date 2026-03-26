"use client";

import { useState } from "react";
import Link from "next/link";
import PropertyForm from "@/components/admin/accommodation/PropertyForm";
import CategoryManager from "@/components/admin/accommodation/CategoryManager";
import RoomManager from "@/components/admin/accommodation/RoomManager";

const TYPE_STYLE = {
  building: { badge: "bg-blue-500/10 text-blue-300 border-blue-500/20",  dot: "bg-blue-400" },
  cottage:  { badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20", dot: "bg-emerald-400" },
};

const TABS = {
  building: [
    {
      id: "details", label: "Property Details",
      icon: (
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
          <path d="M2 14V7L8 2l6 5v7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="5.5" y="9" width="5" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.2"/>
        </svg>
      ),
    },
    {
      id: "categories", label: "Categories",
      icon: (
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
          <rect x="1" y="1" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.2"/>
          <rect x="9" y="1" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.2"/>
          <rect x="1" y="9" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.2"/>
          <rect x="9" y="9" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.2"/>
        </svg>
      ),
    },
    {
      id: "rooms", label: "Rooms",
      icon: (
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
          <rect x="1.5" y="4.5" width="13" height="9" rx="1.3" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M1.5 8.5h13" stroke="currentColor" strokeWidth="1.1"/>
          <path d="M5.5 4.5V3M10.5 4.5V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      ),
    },
  ],
  cottage: [
    {
      id: "details", label: "Property Details",
      icon: (
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
          <path d="M2 14V7L8 2l6 5v7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="5.5" y="9" width="5" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.2"/>
        </svg>
      ),
    },
  ],
};

export default function PropertyEditTabs({ property, categories, roomsByCategory, canWrite }) {
  const tabs    = TABS[property.type] ?? TABS.cottage;
  const [tab, setTab] = useState("details");

  const allRooms = Object.values(roomsByCategory).flat();
  const ts       = TYPE_STYLE[property.type] ?? TYPE_STYLE.building;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[11px] text-white/25 mb-2">
            <Link
              href="/admin/accommodation"
              className="hover:text-white/50 transition-colors duration-200 flex items-center gap-1"
            >
              <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
                <path d="M1 6V3L6 1l5 2v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <rect x="3.5" y="6" width="5" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
              Accommodation
            </Link>
            <svg viewBox="0 0 8 12" width="5" height="9" fill="none">
              <path d="M2 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="text-white/45 truncate">{property.name}</span>
          </div>

          {/* Property name + badges */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-[18px] font-semibold text-white/85 truncate">{property.name}</h2>
            <span className={`text-[9.5px] uppercase tracking-wider font-semibold px-2.5 py-1
              rounded-full border flex items-center gap-1.5 ${ts.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${ts.dot}`} />
              {property.type}
            </span>
            {!property.isActive && (
              <span className="text-[9.5px] uppercase tracking-wider font-semibold px-2.5 py-1
                rounded-full bg-white/5 text-white/30 border border-white/10">
                Inactive
              </span>
            )}
            {property.supportsDayLong && (
              <span className="text-[9px] uppercase tracking-wider bg-[#7A2267]/15 text-[#c05aae]
                border border-[#7A2267]/25 px-2.5 py-1 rounded-full font-semibold">
                Day Long ✓
              </span>
            )}
          </div>

          {property.location && (
            <p className="text-[11px] text-white/25 mt-1">{property.location}</p>
          )}
        </div>
      </div>

      {/* ── Tab navigation ── */}
      <div className="flex items-end gap-0 border-b border-white/7">
        {tabs.map((t) => {
          const count =
            t.id === "categories" ? categories.length
            : t.id === "rooms"    ? allRooms.length
            : null;

          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-2 px-4 py-3 text-[12px] font-medium
                transition-all duration-200 border-b-2 -mb-px
                ${tab === t.id
                  ? "text-white border-[#7A2267]"
                  : "text-white/30 border-transparent hover:text-white/60 hover:border-white/15"
                }`}
            >
              <span className={`transition-colors duration-200 ${tab === t.id ? "text-[#c05aae]" : "text-white/25"}`}>
                {t.icon}
              </span>
              {t.label}
              {count !== null && count > 0 && (
                <span className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center
                  transition-all duration-200
                  ${tab === t.id
                    ? "bg-[#7A2267]/25 text-[#c05aae]"
                    : "bg-white/6 text-white/30"
                  }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ── */}
      <div>
        {tab === "details" && (
          canWrite
            ? <PropertyForm property={property} />
            : (
              <div className="flex items-center gap-3 bg-white/2 border border-white/6
                rounded-2xl p-6">
                <svg viewBox="0 0 16 16" width="15" height="15" fill="none" className="text-white/20 shrink-0">
                  <rect x="2" y="7" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                <p className="text-[13px] text-white/30">Read-only access — you cannot edit accommodation.</p>
              </div>
            )
        )}

        {tab === "categories" && (
          <CategoryManager
            propertyId={property._id}
            blocks={property.blocks ?? []}
            propertySupportsDayLong={property.supportsDayLong ?? false}
            initialCategories={categories}
          />
        )}

        {tab === "rooms" && (
          <RoomManager
            propertyId={property._id}
            categories={categories}
            blocks={property.blocks ?? []}
            initialRooms={allRooms}
            onNeedCategories={() => setTab("categories")}
          />
        )}
      </div>
    </div>
  );
}
