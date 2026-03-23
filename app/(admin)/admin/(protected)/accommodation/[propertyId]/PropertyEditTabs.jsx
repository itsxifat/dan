"use client";

import { useState } from "react";
import Link from "next/link";
import PropertyForm from "@/components/admin/accommodation/PropertyForm";
import CategoryManager from "@/components/admin/accommodation/CategoryManager";
import RoomManager from "@/components/admin/accommodation/RoomManager";

const TABS_BUILDING = ["Details", "Categories", "Rooms"];
const TABS_COTTAGE  = ["Details"];

const TYPE_BADGE = {
  building: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  cottage:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export default function PropertyEditTabs({ property, categories, roomsByCategory, canWrite }) {
  const tabs    = property.type === "building" ? TABS_BUILDING : TABS_COTTAGE;
  const [tab, setTab] = useState("Details");

  const allRooms = Object.values(roomsByCategory).flat();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h2 className="text-[18px] font-semibold text-white/85 truncate">{property.name}</h2>
            <span className={`text-[9.5px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full border ${TYPE_BADGE[property.type]}`}>
              {property.type}
            </span>
            {!property.isActive && (
              <span className="text-[9.5px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full
                bg-white/5 text-white/30 border border-white/10">
                Inactive
              </span>
            )}
          </div>
          {property.location && (
            <p className="text-[11px] text-white/25">{property.location}</p>
          )}
        </div>
        <Link
          href="/admin/accommodation"
          className="text-[11.5px] text-white/30 hover:text-white/60 flex items-center gap-1.5 transition-colors duration-200"
        >
          <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
            <path d="M8 10 4 6l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          All Properties
        </Link>
      </div>

      {/* Tabs */}
      {tabs.length > 1 && (
        <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 w-fit">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-[12px] font-medium transition-all duration-200
                ${tab === t
                  ? "bg-white/8 text-white shadow-sm"
                  : "text-white/30 hover:text-white/60"
                }`}
            >
              {t}
              {t === "Categories" && categories.length > 0 && (
                <span className="ml-1.5 text-[10px] text-white/25">{categories.length}</span>
              )}
              {t === "Rooms" && allRooms.length > 0 && (
                <span className="ml-1.5 text-[10px] text-white/25">{allRooms.length}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      <div>
        {tab === "Details" && (
          canWrite
            ? <PropertyForm property={property} />
            : (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 text-[13px] text-white/30">
                You have read-only access to accommodation.
              </div>
            )
        )}

        {tab === "Categories" && (
          <CategoryManager
            propertyId={property._id}
            initialCategories={categories}
          />
        )}

        {tab === "Rooms" && (
          <RoomManager
            propertyId={property._id}
            categories={categories}
            initialRooms={allRooms}
            onNeedCategories={() => setTab("Categories")}
          />
        )}
      </div>
    </div>
  );
}
