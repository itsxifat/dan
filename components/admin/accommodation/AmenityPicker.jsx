"use client";

import { useState, useMemo } from "react";
import { ICON_MAP } from "@/lib/iconLibrary";

function AmenityIcon({ amenity, size = 18 }) {
  if (!amenity?.iconValue) return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="10"/>
    </svg>
  );
  if (amenity.iconType === "upload") {
    return <img src={amenity.iconValue} alt="" style={{ width: size, height: size }} className="object-contain" />;
  }
  const icon = ICON_MAP[amenity.iconValue];
  if (!icon) return null;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" dangerouslySetInnerHTML={{ __html: icon.d }} />
  );
}

/**
 * Props:
 *   amenities        — all available amenity objects from DB
 *   selected         — string[] of currently selected amenity names
 *   onChange(names)  — called with updated array of names
 */
export default function AmenityPicker({ amenities = [], selected = [], onChange }) {
  const [search, setSearch]    = useState("");
  const [catFilter, setCat]    = useState("All");
  const [customInput, setCustom] = useState("");

  const categories = useMemo(() => {
    const cats = [...new Set(amenities.map((a) => a.category || "General"))];
    return ["All", ...cats];
  }, [amenities]);

  const filtered = useMemo(() => {
    let list = amenities.filter((a) => a.isActive);
    if (catFilter !== "All") list = list.filter((a) => (a.category || "General") === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.name.toLowerCase().includes(q));
    }
    return list;
  }, [amenities, catFilter, search]);

  function toggle(name) {
    if (selected.includes(name)) {
      onChange(selected.filter((x) => x !== name));
    } else {
      onChange([...selected, name]);
    }
  }

  function addCustom() {
    const val = customInput.trim();
    if (!val || selected.includes(val)) return;
    onChange([...selected, val]);
    setCustom("");
  }

  // Group filtered by category
  const grouped = useMemo(() => {
    return filtered.reduce((acc, a) => {
      const cat = a.category || "General";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(a);
      return acc;
    }, {});
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* Search + category filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-[13px]
              text-white placeholder-white/20 focus:outline-none focus:border-[#7A2267]/60 transition-all duration-200"
            placeholder="Search amenities…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" viewBox="0 0 16 16" width="14" height="14" fill="none">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M10 10l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </div>
        <select
          className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-[12px]
            text-white/60 focus:outline-none focus:border-[#7A2267]/60 transition-all duration-200 w-36 shrink-0"
          value={catFilter}
          onChange={(e) => setCat(e.target.value)}
        >
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Amenity grid */}
      {amenities.length === 0 ? (
        <div className="py-8 text-center text-white/25 text-[12px] border border-white/[0.06] rounded-xl">
          No amenities defined yet. Go to{" "}
          <a href="/admin/amenities" target="_blank" className="text-[#c05aae] underline">Admin → Amenities</a>
          {" "}to create them.
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <p className="text-[9px] uppercase tracking-[0.18em] text-white/20 font-semibold px-1 mb-1.5">{cat}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {items.map((amenity) => {
                  const isSelected = selected.includes(amenity.name);
                  return (
                    <button
                      key={amenity._id}
                      type="button"
                      onClick={() => toggle(amenity.name)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left
                        transition-all duration-200
                        ${isSelected
                          ? "bg-[#7A2267]/20 border-[#7A2267]/50 text-[#c05aae]"
                          : "border-white/[0.08] text-white/40 hover:border-white/20 hover:text-white/65"
                        }`}
                    >
                      <span className="shrink-0">
                        <AmenityIcon amenity={amenity} size={15} />
                      </span>
                      <span className="text-[11px] font-medium leading-tight line-clamp-2">{amenity.name}</span>
                      {isSelected && (
                        <svg className="ml-auto shrink-0" viewBox="0 0 12 12" width="10" height="10" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-6 text-center text-white/25 text-[12px]">No matching amenities</div>
          )}
        </div>
      )}

      {/* Custom amenity */}
      <div>
        <p className="text-[9.5px] uppercase tracking-wider text-white/20 font-semibold mb-1.5">Add custom amenity</p>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[13px]
              text-white placeholder-white/20 focus:outline-none focus:border-[#7A2267]/60 transition-all duration-200"
            placeholder='Type a name and press Enter…'
            value={customInput}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
          />
          <button
            type="button"
            onClick={addCustom}
            className="px-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-[12px]
              text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200 shrink-0"
          >
            Add
          </button>
        </div>
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div>
          <p className="text-[9.5px] uppercase tracking-wider text-white/20 font-semibold mb-2">
            Selected ({selected.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {selected.map((name) => {
              const match = amenities.find((a) => a.name === name);
              return (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium
                    bg-[#7A2267]/15 border border-[#7A2267]/30 text-[#c05aae] px-2.5 py-1 rounded-full"
                >
                  {match && <AmenityIcon amenity={match} size={12} />}
                  {name}
                  <button
                    type="button"
                    onClick={() => toggle(name)}
                    className="text-[#c05aae]/60 hover:text-[#c05aae] transition-colors leading-none ml-0.5"
                  >×</button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
