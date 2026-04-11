"use client";

import { useState, useTransition, useMemo, useEffect, useRef, lazy, Suspense } from "react";
import {
  getAmenities, createAmenity, updateAmenity, deleteAmenity,
} from "@/actions/accommodation/amenityActions";
import { ICON_LIBRARY, ICON_MAP, ICON_CATEGORIES } from "@/lib/iconLibrary";

const MediaPicker = lazy(() => import("@/components/admin/MediaPicker"));

// ── Shared styles ─────────────────────────────────────────────────────────────
const INPUT = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-[#7A2267]/60 focus:bg-white/[0.06] transition-all duration-200";
const LABEL = "block text-[10px] uppercase tracking-wider text-white/35 font-semibold mb-2";

const ALL_CATS = ["General", ...ICON_CATEGORIES];

// ── Custom Dropdown ────────────────────────────────────────────────────────────
function CustomSelect({ value, onChange, options, placeholder = "Select…" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) { if (!ref.current?.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const label = options.find((o) => (o.value ?? o) === value)?.label ?? value ?? placeholder;

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${INPUT} flex items-center justify-between gap-2 text-left cursor-pointer
          ${!value ? "text-white/25" : "text-white"}`}
      >
        <span className="truncate">{label}</span>
        <svg
          viewBox="0 0 16 16" width="12" height="12" fill="none"
          className={`shrink-0 transition-transform duration-200 text-white/30 ${open ? "rotate-180" : ""}`}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#1a1a1a] border border-white/[0.1]
          rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
          {options.map((opt) => {
            const v = opt.value ?? opt;
            const l = opt.label ?? opt;
            const isSelected = v === value;
            return (
              <button
                key={v}
                type="button"
                onClick={() => { onChange(v); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-[12.5px] flex items-center gap-2
                  transition-colors duration-150
                  ${isSelected
                    ? "bg-[#7A2267]/20 text-[#c05aae]"
                    : "text-white/55 hover:bg-white/[0.05] hover:text-white/85"
                  }`}
              >
                {isSelected && (
                  <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {!isSelected && <span className="w-[10px]" />}
                {l}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Icon rendering ─────────────────────────────────────────────────────────────
function RenderIcon({ amenity, size = 20 }) {
  if (!amenity?.iconValue) return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="10"/>
    </svg>
  );
  if (amenity.iconType === "upload") {
    return <img src={amenity.iconValue} alt="" width={size} height={size} className="object-contain rounded" />;
  }
  const icon = ICON_MAP[amenity.iconValue];
  if (!icon) return null;
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" dangerouslySetInnerHTML={{ __html: icon.d }} />;
}

// ── Icon Picker ────────────────────────────────────────────────────────────────
function IconPicker({ iconType, iconValue, onChange }) {
  const [tab, setTab]       = useState(iconType === "upload" ? "upload" : "library");
  const [search, setSearch] = useState("");
  const [catFilter, setCat] = useState("All");
  const [mediaPicker, setMedia] = useState(false);
  const searchRef = useRef(null);

  const catOptions = [
    { value: "All", label: "All Categories" },
    ...ICON_CATEGORIES.map((c) => ({ value: c, label: c })),
  ];

  const filtered = useMemo(() => {
    let list = ICON_LIBRARY;
    if (catFilter !== "All") list = list.filter((i) => i.category === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.label.toLowerCase().includes(q) || i.key.includes(q) || i.category.toLowerCase().includes(q));
    }
    return list;
  }, [search, catFilter]);

  // Group by category for display
  const grouped = useMemo(() => {
    if (search.trim() || catFilter !== "All") return null; // flat when filtering
    return filtered.reduce((acc, i) => {
      if (!acc[i.category]) acc[i.category] = [];
      acc[i.category].push(i);
      return acc;
    }, {});
  }, [filtered, search, catFilter]);

  return (
    <div className="space-y-4">
      {/* Source tabs */}
      <div className="flex gap-2">
        {[
          { id: "library", label: "Icon Library", count: ICON_LIBRARY.length },
          { id: "upload",  label: "Custom Image" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-medium border transition-all duration-200
              ${tab === t.id
                ? "bg-[#7A2267]/20 border-[#7A2267]/50 text-[#c05aae]"
                : "border-white/[0.08] text-white/35 hover:text-white/65 hover:border-white/15"
              }`}
          >
            {t.label}
            {t.count && <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${tab === t.id ? "bg-[#7A2267]/30 text-[#c05aae]" : "bg-white/8 text-white/30"}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {tab === "library" && (
        <div className="space-y-3">
          {/* Search + filter row */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" viewBox="0 0 16 16" width="14" height="14" fill="none">
                <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M10 10l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <input
                ref={searchRef}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3
                  text-[13px] text-white placeholder-white/25 focus:outline-none focus:border-[#7A2267]/60 transition-all duration-200"
                placeholder={`Search ${ICON_LIBRARY.length}+ icons by name or category…`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoComplete="off"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  <svg viewBox="0 0 12 12" width="12" height="12" fill="none">
                    <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
            <div className="w-52 shrink-0">
              <CustomSelect
                value={catFilter}
                onChange={setCat}
                options={catOptions}
              />
            </div>
          </div>

          {/* Results summary */}
          <div className="flex items-center justify-between px-1">
            <p className="text-[10.5px] text-white/25">
              {search || catFilter !== "All"
                ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`
                : `${ICON_LIBRARY.length} icons across ${ICON_CATEGORIES.length} categories`}
            </p>
            {(search || catFilter !== "All") && (
              <button type="button" onClick={() => { setSearch(""); setCat("All"); }} className="text-[10px] text-[#c05aae]/60 hover:text-[#c05aae] transition-colors">
                Clear filters
              </button>
            )}
          </div>

          {/* Icon grid */}
          <div className="border border-white/[0.07] rounded-2xl overflow-hidden bg-white/[0.02]">
            <div className="max-h-80 overflow-y-auto p-3 space-y-4">
              {filtered.length === 0 && (
                <div className="py-12 text-center text-white/25">
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" className="mx-auto mb-3 text-white/15">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <p className="text-[13px]">No icons found for "{search}"</p>
                  <p className="text-[11px] mt-1">Try a different keyword</p>
                </div>
              )}

              {/* When searching/filtering — flat grid */}
              {(search.trim() || catFilter !== "All") && filtered.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1">
                  {filtered.map((icon) => <IconButton key={icon.key} icon={icon} selected={iconType === "library" && iconValue === icon.key} onSelect={() => onChange("library", icon.key)} />)}
                </div>
              )}

              {/* Default — grouped by category */}
              {!search.trim() && catFilter === "All" && grouped && (
                Object.entries(grouped).map(([cat, icons]) => (
                  <div key={cat}>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-white/20 font-semibold mb-2 px-1">{cat}</p>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1">
                      {icons.map((icon) => <IconButton key={icon.key} icon={icon} selected={iconType === "library" && iconValue === icon.key} onSelect={() => onChange("library", icon.key)} />)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Selected preview bar */}
          {iconType === "library" && iconValue && (
            <div className="flex items-center gap-3 px-4 py-3 bg-[#7A2267]/10 border border-[#7A2267]/25 rounded-xl">
              <div className="w-9 h-9 rounded-xl bg-[#7A2267]/20 flex items-center justify-center text-[#c05aae] shrink-0">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" dangerouslySetInnerHTML={{ __html: ICON_MAP[iconValue]?.d ?? "" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] text-white/80 font-medium">{ICON_MAP[iconValue]?.label ?? iconValue}</p>
                <p className="text-[10px] text-white/35">{ICON_MAP[iconValue]?.category}</p>
              </div>
              <button type="button" onClick={() => onChange("library", "")} className="text-white/25 hover:text-white/60 transition-colors shrink-0">
                <svg viewBox="0 0 12 12" width="12" height="12" fill="none">
                  <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "upload" && (
        <div className="space-y-3">
          {iconType === "upload" && iconValue ? (
            <div className="flex items-center gap-4 p-4 bg-white/[0.04] border border-white/[0.08] rounded-xl">
              <img src={iconValue} alt="Icon preview" className="w-14 h-14 object-contain rounded-xl bg-white/5 p-2" />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-white/65 font-medium">Custom image selected</p>
                <p className="text-[10px] text-white/30 truncate mt-0.5">{iconValue}</p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button type="button" onClick={() => setMedia(true)}
                  className="px-3 py-1.5 rounded-lg bg-white/6 border border-white/10 text-[11px] text-white/50 hover:text-white hover:bg-white/10 transition-all">
                  Replace
                </button>
                <button type="button" onClick={() => onChange("library", "")}
                  className="px-3 py-1.5 rounded-lg border border-white/[0.06] text-[11px] text-white/30 hover:text-red-400 hover:border-red-500/25 transition-all">
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setMedia(true)}
              className="w-full rounded-2xl border-2 border-dashed border-white/10 hover:border-[#7A2267]/50
                py-10 text-center transition-all duration-200 group">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/5 group-hover:bg-[#7A2267]/15 flex items-center justify-center transition-colors duration-200">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" className="text-white/20 group-hover:text-[#c05aae] transition-colors">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[13px] font-medium text-white/35 group-hover:text-white/55 transition-colors">Choose from Media Library</p>
                  <p className="text-[11px] text-white/18 mt-1">Upload your icon via Admin → Media first, then pick here</p>
                </div>
              </div>
            </button>
          )}
          {mediaPicker && (
            <Suspense fallback={null}>
              <MediaPicker open onClose={() => setMedia(false)} onSelect={(url) => { onChange("upload", url); setMedia(false); }} />
            </Suspense>
          )}
        </div>
      )}
    </div>
  );
}

function IconButton({ icon, selected, onSelect }) {
  return (
    <button
      type="button"
      title={icon.label}
      onClick={onSelect}
      className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all duration-150
        ${selected
          ? "bg-[#7A2267]/30 text-[#c05aae] ring-1 ring-[#7A2267]/60"
          : "text-white/35 hover:bg-white/6 hover:text-white/75"
        }`}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" dangerouslySetInnerHTML={{ __html: icon.d }} />
      <span className="text-[8px] leading-tight text-center line-clamp-1 w-full" style={{ maxWidth: 52 }}>
        {icon.label}
      </span>
    </button>
  );
}

// ── Amenity Form ───────────────────────────────────────────────────────────────
function AmenityForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    name:      initial?.name      ?? "",
    category:  initial?.category  ?? "General",
    iconType:  initial?.iconType  ?? "library",
    iconValue: initial?.iconValue ?? "",
    sortOrder: initial?.sortOrder ?? 0,
    isActive:  initial?.isActive  ?? true,
  });
  const [isPending, start] = useTransition();
  const [error, setError]  = useState("");

  const catOptions = ALL_CATS.map((c) => ({ value: c, label: c }));

  function handleIconChange(type, value) {
    setForm((f) => ({ ...f, iconType: type, iconValue: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return setError("Amenity name is required.");
    setError("");
    start(async () => {
      try { await onSave(form); }
      catch (err) { setError(err.message || "Failed to save."); }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="text-[12px] text-red-400 bg-red-500/10 border border-red-500/25 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Name + Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 sm:col-span-1">
          <label className={LABEL}>Amenity Name *</label>
          <input
            className={INPUT}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Free WiFi"
            required
            autoFocus
          />
        </div>
        <div>
          <label className={LABEL}>Category</label>
          <CustomSelect value={form.category} onChange={(v) => setForm((f) => ({ ...f, category: v }))} options={catOptions} />
        </div>
      </div>

      {/* Sort order + active */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Sort Order</label>
          <input
            type="number"
            className={INPUT}
            value={form.sortOrder}
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
            min="0"
          />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative shrink-0">
              <input type="checkbox" className="sr-only" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
              <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${form.isActive ? "bg-[#7A2267]" : "bg-white/10"}`} />
              <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${form.isActive ? "translate-x-5" : "translate-x-0"}`} />
            </div>
            <div>
              <p className="text-[12.5px] font-medium text-white/65">Active</p>
              <p className="text-[10px] text-white/25">Visible to properties</p>
            </div>
          </label>
        </div>
      </div>

      {/* Icon picker */}
      <div>
        <label className={LABEL}>Icon</label>
        <IconPicker iconType={form.iconType} iconValue={form.iconValue} onChange={handleIconChange} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06]">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-[#7A2267] text-white text-[13px] font-semibold
            hover:bg-[#8e2878] disabled:opacity-50 transition-colors duration-200"
        >
          {isPending ? "Saving…" : initial ? "Save Changes" : "Create Amenity"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 sm:flex-none px-5 py-3 rounded-xl border border-white/[0.08] text-white/35
            text-[13px] hover:text-white/60 hover:border-white/15 transition-all duration-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Main AmenityManager ────────────────────────────────────────────────────────
export default function AmenityManager({ initialAmenities }) {
  const [amenities, setAmenities] = useState(initialAmenities);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEdit]        = useState(null);   // null = create mode
  const [search, setSearch]       = useState("");
  const [catFilter, setCat]       = useState("All");
  const [, startTransition]       = useTransition();

  async function reload() {
    const data = await getAmenities();
    setAmenities(data);
  }

  function openCreate() { setEdit(null); setPanelOpen(true); }
  function openEdit(a)  { setEdit(a);   setPanelOpen(true); }
  function closePanel() { setPanelOpen(false); setEdit(null); }

  async function handleSave(form) {
    if (editing) {
      await updateAmenity(editing._id, form);
    } else {
      await createAmenity(form);
    }
    await reload();
    closePanel();
  }

  async function handleDelete(amenity) {
    if (!confirm(`Delete "${amenity.name}"? It will no longer appear with its icon on properties.`)) return;
    startTransition(async () => {
      await deleteAmenity(amenity._id);
      await reload();
    });
  }

  // Category options for filter
  const availableCats = useMemo(() => {
    const cats = [...new Set(amenities.map((a) => a.category || "General"))];
    return ["All", ...cats];
  }, [amenities]);

  const filtered = useMemo(() => {
    let list = amenities;
    if (catFilter !== "All") list = list.filter((a) => (a.category || "General") === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.name.toLowerCase().includes(q) || (a.category || "").toLowerCase().includes(q));
    }
    return list;
  }, [amenities, catFilter, search]);

  const grouped = useMemo(() => {
    return filtered.reduce((acc, a) => {
      const cat = a.category || "General";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(a);
      return acc;
    }, {});
  }, [filtered]);

  return (
    <div className="relative">
      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" viewBox="0 0 16 16" width="15" height="15" fill="none">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M10 10l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-11 pr-4 py-3
              text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-[#7A2267]/60 transition-all duration-200"
            placeholder="Search amenities by name or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/55">
              <svg viewBox="0 0 12 12" width="12" height="12" fill="none">
                <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

        {/* Category quick-filter (desktop) */}
        <div className="hidden sm:block w-52">
          <CustomSelect
            value={catFilter}
            onChange={setCat}
            options={availableCats.map((c) => ({ value: c, label: c === "All" ? "All Categories" : c }))}
          />
        </div>

        {/* Add button */}
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#7A2267] text-white
            text-[13px] font-semibold hover:bg-[#8e2878] transition-colors duration-200 shrink-0"
        >
          <svg viewBox="0 0 14 14" width="12" height="12" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          Add Amenity
        </button>
      </div>

      {/* Category pills (mobile) */}
      {availableCats.length > 2 && (
        <div className="flex sm:hidden gap-2 overflow-x-auto pb-3 mb-3 -mx-1 px-1 scrollbar-hide">
          {availableCats.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-medium border transition-all duration-200
                ${catFilter === c
                  ? "bg-[#7A2267]/25 border-[#7A2267]/50 text-[#c05aae]"
                  : "border-white/[0.08] text-white/35 hover:text-white/60"
                }`}
            >
              {c === "All" ? "All" : c}
            </button>
          ))}
        </div>
      )}

      {/* ── Stats bar ── */}
      {amenities.length > 0 && (
        <div className="flex items-center gap-4 mb-5 px-1">
          <span className="text-[11px] text-white/25">
            {filtered.length} of {amenities.length} amenities
          </span>
          {(search || catFilter !== "All") && (
            <button type="button" onClick={() => { setSearch(""); setCat("All"); }} className="text-[10.5px] text-[#c05aae]/60 hover:text-[#c05aae]">
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* ── Empty state ── */}
      {amenities.length === 0 && (
        <div className="py-24 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" className="text-white/15">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-[15px] font-medium text-white/45">No amenities yet</p>
            <p className="text-[12px] text-white/25 mt-1">Create your first amenity with a custom icon</p>
          </div>
          <button onClick={openCreate}
            className="mt-2 px-6 py-2.5 rounded-xl bg-[#7A2267] text-white text-[13px] font-semibold hover:bg-[#8e2878] transition-colors">
            Create First Amenity
          </button>
        </div>
      )}

      {/* ── Grouped amenity cards ── */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat}>
            <div className="flex items-center gap-3 mb-3">
              <p className="text-[9.5px] uppercase tracking-[0.18em] text-white/25 font-semibold">{cat}</p>
              <span className="text-[9px] text-white/15 px-1.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
                {items.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {items.map((amenity) => (
                <AmenityCard key={amenity._id} amenity={amenity} onEdit={() => openEdit(amenity)} onDelete={() => handleDelete(amenity)} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Slide-in form panel ── */}
      {panelOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={closePanel}
          />
          {/* Panel — right drawer on desktop, bottom sheet on mobile */}
          <div className="fixed inset-x-0 bottom-0 sm:inset-x-auto sm:right-0 sm:top-0 sm:bottom-0 sm:w-[520px] z-50
            bg-[#111] border-t sm:border-t-0 sm:border-l border-white/[0.08]
            flex flex-col max-h-[90vh] sm:max-h-none overflow-hidden
            rounded-t-3xl sm:rounded-none shadow-2xl">

            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.07] shrink-0">
              <div>
                <h3 className="text-[15px] font-semibold text-white/85">
                  {editing ? "Edit Amenity" : "New Amenity"}
                </h3>
                {editing && <p className="text-[11px] text-white/30 mt-0.5">{editing.name}</p>}
              </div>
              <button onClick={closePanel} className="w-8 h-8 flex items-center justify-center rounded-xl text-white/30 hover:text-white/65 hover:bg-white/8 transition-all">
                <svg viewBox="0 0 14 14" width="14" height="14" fill="none">
                  <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Scrollable form body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <AmenityForm
                initial={editing}
                onSave={handleSave}
                onCancel={closePanel}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Amenity Card ───────────────────────────────────────────────────────────────
function AmenityCard({ amenity, onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-3.5 px-4 py-3.5 bg-white/[0.03] border border-white/[0.07]
      rounded-2xl group hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-200">

      {/* Icon box */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200
        ${amenity.isActive
          ? "bg-[#7A2267]/15 text-[#c05aae] group-hover:bg-[#7A2267]/25"
          : "bg-white/5 text-white/20"
        }`}>
        <RenderIcon amenity={amenity} size={19} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-semibold truncate ${amenity.isActive ? "text-white/80" : "text-white/30"}`}>
          {amenity.name}
        </p>
        <p className="text-[10px] text-white/25 truncate">
          {amenity.iconType === "library" && amenity.iconValue
            ? `${ICON_MAP[amenity.iconValue]?.category ?? ""} · ${ICON_MAP[amenity.iconValue]?.label ?? amenity.iconValue}`
            : amenity.iconType === "upload" ? "Custom image icon"
            : "No icon set"}
        </p>
      </div>

      {/* Inactive badge */}
      {!amenity.isActive && (
        <span className="text-[8px] uppercase tracking-wider text-white/20 border border-white/[0.07] px-2 py-0.5 rounded-full shrink-0">
          Off
        </span>
      )}

      {/* Action buttons — always visible on mobile, hover on desktop */}
      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 shrink-0">
        <button
          onClick={onEdit}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30
            hover:text-white/75 hover:bg-white/8 transition-all duration-200"
          title="Edit"
        >
          <svg viewBox="0 0 14 14" width="13" height="13" fill="none">
            <path d="M10 2l2 2-7 7H3v-2l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          onClick={onDelete}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-white/20
            hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          title="Delete"
        >
          <svg viewBox="0 0 14 14" width="13" height="13" fill="none">
            <path d="M2 3.5h10M5 3.5V2.5h4v1M3 3.5l.7 8.2c.05.4.4.8.8.8h5c.4 0 .75-.4.8-.8L11 3.5M5.5 6v4M8.5 6v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
