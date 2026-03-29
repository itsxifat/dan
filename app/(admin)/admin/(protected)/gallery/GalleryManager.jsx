"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { Montserrat } from "next/font/google";
import {
  createGalleryPhoto,
  updateGalleryPhoto,
  deleteGalleryPhoto,
  bulkTogglePublish,
  createGalleryCategory,
  deleteGalleryCategory,
} from "@/actions/gallery/galleryActions";
import { PLACEMENT_SLOTS, IMAGE_SIZES } from "@/lib/galleryConstants";
import ImageUpload from "@/components/ui/ImageUpload";

const sans = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });

const LABEL = `${sans.className} block text-[9px] uppercase tracking-[0.18em] font-semibold text-white/35 mb-1.5`;
const INPUT = `w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3.5 py-2.5
  text-[12.5px] text-white/85 placeholder-white/20 outline-none
  focus:border-[#7A2267]/50 focus:bg-white/[0.07] transition-all duration-200`;

const BLANK = { title: "", image: "", altText: "", category: "General", placement: "none", imageSize: "square", isPublished: true, sortOrder: 0 };

// ── Shared card style ─────────────────────────────────────────────────────────
const CARD_BASE = "relative flex flex-col items-center p-3 rounded-xl border text-center transition-all duration-200";
const CARD_ON   = "border-[#7A2267]/60 bg-[#7A2267]/15 ring-1 ring-[#7A2267]/25";
const CARD_OFF  = "border-white/[0.08] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05] cursor-pointer";
const CARD_DIS  = "border-white/[0.05] bg-white/[0.02] opacity-45 cursor-not-allowed";

// ── Unified size + placement options ──────────────────────────────────────────
// Each option sets BOTH imageSize (category grid) and placement (homepage slot).
// Ratios are identical across both views — one image, one crop.
const SIZE_OPTIONS = [
  // Category-only (placement = "none")
  { id: "cat-square",    label: "Square",    ratio: "1:1",  sub: "Category only", placement: "none",   imageSize: "square",    preview: <div className="w-7 h-7 rounded bg-white/10 border border-white/15" /> },
  { id: "cat-landscape", label: "Landscape", ratio: "2:1",  sub: "Category only", placement: "none",   imageSize: "landscape", preview: <div className="w-10 h-5 rounded bg-white/10 border border-white/15" /> },
  { id: "cat-portrait",  label: "Portrait",  ratio: "3:4",  sub: "Category only", placement: "none",   imageSize: "portrait",  preview: <div className="w-[21px] h-7 rounded bg-white/10 border border-white/15" /> },
  { id: "cat-wide",      label: "Wide",      ratio: "16:5", sub: "Category only", placement: "none",   imageSize: "wide",      preview: <div className="w-full h-[14px] rounded bg-white/10 border border-white/15" /> },
  // Homepage featured (also appears in category grid with same ratio)
  { id: "hp-hero",       label: "Hero",      ratio: "1:1",  sub: "Homepage + cat", placement: "hero",   imageSize: "square",    maxCount: 1,  preview: <div className="w-7 h-7 rounded bg-white/10 border border-white/15" /> },
  { id: "hp-banner",     label: "Banner",    ratio: "16:5", sub: "Homepage + cat", placement: "banner", imageSize: "wide",      maxCount: 1,  preview: <div className="w-full h-[14px] rounded bg-white/10 border border-white/15" /> },
  { id: "hp-wide",       label: "Wide",      ratio: "2:1",  sub: "Homepage + cat", placement: "wide",   imageSize: "landscape", maxCount: 1,  preview: <div className="w-10 h-5 rounded bg-white/10 border border-white/15" /> },
  { id: "hp-square",     label: "Square",    ratio: "1:1",  sub: "Homepage + cat", placement: "square", imageSize: "square",    maxCount: 6,  preview: <div className="w-7 h-7 rounded bg-white/10 border border-white/15" /> },
];

function activeOptionId(imageSize, placement) {
  if (placement && placement !== "none") return SIZE_OPTIONS.find((o) => o.placement === placement)?.id ?? "cat-square";
  return SIZE_OPTIONS.find((o) => o.placement === "none" && o.imageSize === imageSize)?.id ?? "cat-square";
}

// ── Unified Size + Placement Selector ─────────────────────────────────────────
function SizePlacementSelector({ imageSize, placement, onChange, placementCounts, editingPlacement }) {
  const activeId = activeOptionId(imageSize, placement);
  const activeOpt = SIZE_OPTIONS.find((o) => o.id === activeId);

  return (
    <div>
      <label className={LABEL}>
        Size &amp; Placement <span className="text-[#7A2267]">*</span>
        <span className="ml-2 normal-case font-normal text-white/20">— crop ratio + where it appears</span>
      </label>

      {/* Row 1 — category only */}
      <p className={`${sans.className} text-[8px] uppercase tracking-[0.14em] text-white/20 mb-1.5 mt-1`}>Category grid only</p>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {SIZE_OPTIONS.filter((o) => o.placement === "none").map((opt) => (
          <button key={opt.id} type="button"
            onClick={() => onChange(opt.imageSize, opt.placement)}
            className={`${CARD_BASE} ${activeId === opt.id ? CARD_ON : CARD_OFF}`}
          >
            <div className="w-full flex justify-center items-center h-8 mb-2">{opt.preview}</div>
            <p className={`${sans.className} text-[10px] font-semibold text-white/80 leading-none mb-0.5`}>{opt.label}</p>
            <p className={`${sans.className} text-[8px] text-[#c084b8] font-medium`}>{opt.ratio}</p>
          </button>
        ))}
      </div>

      {/* Row 2 — homepage slots */}
      <p className={`${sans.className} text-[8px] uppercase tracking-[0.14em] text-white/20 mb-1.5`}>Also on homepage grid</p>
      <div className="grid grid-cols-4 gap-2">
        {SIZE_OPTIONS.filter((o) => o.placement !== "none").map((opt) => {
          const used = placementCounts[opt.placement] || 0;
          const effectiveUsed = editingPlacement === opt.placement ? used - 1 : used;
          const isFull = opt.maxCount !== undefined && effectiveUsed >= opt.maxCount;
          const isActive = activeId === opt.id;
          return (
            <button key={opt.id} type="button"
              disabled={isFull && !isActive}
              onClick={() => !isFull && onChange(opt.imageSize, opt.placement)}
              className={`${CARD_BASE} ${isActive ? CARD_ON : isFull ? CARD_DIS : CARD_OFF}`}
            >
              <div className="w-full flex justify-center items-center h-8 mb-2">{opt.preview}</div>
              <p className={`${sans.className} text-[10px] font-semibold text-white/80 leading-none mb-0.5`}>{opt.label}</p>
              <p className={`${sans.className} text-[8px] text-[#c084b8] font-medium`}>{opt.ratio}</p>
              {opt.maxCount !== undefined && (
                <div className={`absolute top-2 right-2 text-[7px] font-semibold px-1.5 py-0.5 rounded-full
                  ${isFull ? "bg-red-500/20 text-red-400 border border-red-500/20" : "bg-white/[0.07] text-white/30 border border-white/[0.08]"} ${sans.className}`}>
                  {Math.max(0, effectiveUsed)}/{opt.maxCount}{isFull ? " Full" : ""}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {activeOpt && (
        <p className={`${sans.className} text-[8.5px] text-white/25 mt-2 leading-snug`}>
          ℹ {activeOpt.placement === "none" ? IMAGE_SIZES[activeOpt.imageSize]?.hint : PLACEMENT_SLOTS[activeOpt.placement]?.hint}
        </p>
      )}
    </div>
  );
}

// ── Category combobox — shows all options on focus, filters on type ────────────
function CategoryCombobox({ value, onChange, categories }) {
  const [open, setOpen] = useState(false);
  const [inputVal, setInputVal] = useState(value || "");
  const [typing, setTyping] = useState(false);
  const ref = useRef(null);

  // Show all categories on focus; filter only when actively typing
  const filtered = typing
    ? categories.filter((c) => c.toLowerCase().includes(inputVal.toLowerCase()))
    : categories;

  function handleSelect(cat) {
    onChange(cat);
    setInputVal(cat);
    setTyping(false);
    setOpen(false);
  }

  function handleChange(e) {
    const v = e.target.value;
    setInputVal(v);
    onChange(v);
    setTyping(true);
    setOpen(true);
  }

  function handleFocus() {
    setTyping(false); // reset so all options show
    setOpen(true);
  }

  function handleBlur(e) {
    if (!ref.current?.contains(e.relatedTarget)) {
      setOpen(false);
      setTyping(false);
    }
  }

  return (
    <div ref={ref} className="relative" onBlur={handleBlur}>
      <input
        className={INPUT}
        value={inputVal}
        onChange={handleChange}
        onFocus={handleFocus}
        placeholder="e.g. Swimming Pool, Rooms…"
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 rounded-xl border border-white/[0.1] bg-[#1a0a18] shadow-xl overflow-hidden max-h-48 overflow-y-auto">
          {filtered.map((c) => (
            <button
              key={c}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(c)}
              className={`w-full text-left px-3.5 py-2 text-[12px] transition-colors
                ${c === value
                  ? `bg-[#7A2267]/20 text-white/90 ${sans.className}`
                  : `text-white/60 hover:bg-white/[0.07] hover:text-white/90 ${sans.className}`
                }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Upload / Edit form ─────────────────────────────────────────────────────────
function PhotoForm({ initial = BLANK, onSave, onCancel, saving, categories = [], placementCounts = {}, editingPlacement = null }) {
  const [form, setForm] = useState({ ...BLANK, ...initial });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function handleSubmit(e) {
    e.preventDefault();
    onSave({ ...form, sortOrder: Number(form.sortOrder) || 0 });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={LABEL}>Photo <span className="text-[#7A2267]">*</span></label>
        <ImageUpload value={form.image} onChange={(url) => setForm((f) => ({ ...f, image: url }))} dark />
      </div>
      <SizePlacementSelector
        imageSize={form.imageSize}
        placement={form.placement}
        onChange={(imageSize, placement) => setForm((f) => ({ ...f, imageSize, placement }))}
        placementCounts={placementCounts}
        editingPlacement={editingPlacement}
      />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Title <span className="text-white/20 normal-case font-normal text-[9px]">(optional)</span></label>
          <input className={INPUT} value={form.title} onChange={set("title")} placeholder="e.g. Infinity Pool at Dusk" />
        </div>
        <div>
          <label className={LABEL}>Alt Text</label>
          <input className={INPUT} value={form.altText} onChange={set("altText")} placeholder="Accessibility description" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Content Category <span className="text-[#7A2267]">*</span></label>
          <CategoryCombobox
            value={form.category}
            onChange={(v) => setForm((f) => ({ ...f, category: v }))}
            categories={categories}
          />
          <p className={`${sans.className} text-[8.5px] text-white/25 mt-1`}>
            Shown in filter tabs on the gallery
          </p>
        </div>
        <div>
          <label className={LABEL}>Sort Order</label>
          <input type="number" className={INPUT} min="0" value={form.sortOrder} onChange={set("sortOrder")} placeholder="0" />
        </div>
      </div>
      <div className="flex items-center gap-3 py-0.5">
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, isPublished: !f.isPublished }))}
          className={`relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0
            ${form.isPublished ? "bg-[#7A2267]" : "bg-white/[0.1]"}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200
            ${form.isPublished ? "left-[22px]" : "left-0.5"}`} />
        </button>
        <span className={`${sans.className} text-[11px] text-white/50`}>
          {form.isPublished ? "Published — visible on site" : "Draft — hidden from site"}
        </span>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={saving || !form.image}
          className={`${sans.className} flex items-center gap-2 px-5 py-2.5 rounded-xl
            bg-[#7A2267] hover:bg-[#8a256f] text-white text-[10px] uppercase tracking-[0.18em] font-semibold
            transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {saving ? "Saving…" : "Save Photo"}
        </button>
        <button
          type="button" onClick={onCancel}
          className={`${sans.className} px-4 py-2.5 rounded-xl border border-white/[0.08]
            text-white/40 hover:text-white/70 text-[10px] uppercase tracking-[0.15em] transition-colors duration-200`}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Photo card ─────────────────────────────────────────────────────────────────
function PhotoCard({ photo, selected, onSelect, onEdit, onDelete, onToggle }) {
  const [, start] = useTransition();
  const slot = PLACEMENT_SLOTS[photo.placement] || PLACEMENT_SLOTS.none;
  const size = IMAGE_SIZES[photo.imageSize] || IMAGE_SIZES.square;

  return (
    <div className={`group relative rounded-xl overflow-hidden bg-white/[0.04]
      border transition-all duration-200 cursor-pointer
      ${selected ? "border-[#7A2267]/60 ring-1 ring-[#7A2267]/30" : "border-white/[0.06] hover:border-white/[0.15]"}`}
    >
      <button
        onClick={() => onSelect(photo._id)}
        className={`absolute top-2 left-2 z-10 w-5 h-5 rounded-md border flex items-center justify-center
          transition-all duration-150
          ${selected ? "bg-[#7A2267] border-[#7A2267]" : "bg-black/30 border-white/20 opacity-0 group-hover:opacity-100 backdrop-blur-sm"}`}
      >
        {selected && (
          <svg viewBox="0 0 10 8" width="8" height="8" fill="none">
            <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <div className="absolute top-2 right-2 z-10">
        <span className={`${sans.className} text-[7.5px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full
          ${photo.isPublished ? "bg-emerald-400/20 text-emerald-400 border border-emerald-400/25" : "bg-white/10 text-white/35 border border-white/10"}`}>
          {photo.isPublished ? "Live" : "Draft"}
        </span>
      </div>
      <div className="relative aspect-[4/3] overflow-hidden bg-white/[0.03]">
        {photo.image ? (
          <Image src={photo.image} alt={photo.altText || photo.title || "Gallery photo"} fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="rgba(255,255,255,0.15)" strokeWidth="1.3" />
              <circle cx="8.5" cy="8.5" r="1.5" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" />
              <path d="M3 16l5-4 4 3 3-2.5 6 5" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
        )}
      </div>
      <div className="px-3 py-2.5">
        <p className={`${sans.className} text-[11px] font-medium text-white/75 truncate`}>
          {photo.title || <span className="text-white/25 italic">Untitled</span>}
        </p>
        <p className={`${sans.className} text-[9px] uppercase tracking-wider text-white/30 mt-0.5`}>{photo.category}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className={`${sans.className} text-[8px] uppercase tracking-wider text-[#c084b8]/50`}>{size.label} {size.ratio}</p>
          <span className="text-white/15">·</span>
          <p className={`${sans.className} text-[8px] uppercase tracking-wider text-white/25`}>{slot.label}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 px-3 pb-3">
        <button onClick={() => onEdit(photo)}
          className={`${sans.className} flex-1 py-1.5 rounded-lg text-[9px] uppercase tracking-wider
            border border-white/[0.07] text-white/35 hover:text-white/65 hover:border-white/18 transition-colors duration-150`}>
          Edit
        </button>
        <button onClick={() => start(async () => { await onToggle(photo); })}
          className={`${sans.className} flex-1 py-1.5 rounded-lg text-[9px] uppercase tracking-wider border transition-colors duration-150
            ${photo.isPublished
              ? "border-amber-500/15 text-amber-400/50 hover:border-amber-500/30 hover:text-amber-400"
              : "border-emerald-500/15 text-emerald-400/50 hover:border-emerald-500/30 hover:text-emerald-400"}`}>
          {photo.isPublished ? "Hide" : "Show"}
        </button>
        <button onClick={() => onDelete(photo._id)}
          className={`${sans.className} py-1.5 px-2 rounded-lg border border-red-500/15 text-red-400/40 hover:border-red-500/30 hover:text-red-400 transition-colors duration-150`}>
          <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
            <path d="M1.5 3h9M4 3V2h4v1M3 3l.6 7.5h4.8L9 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Categories Panel ───────────────────────────────────────────────────────────
function CategoriesPanel({ categories, onAdd, onDelete }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [, start] = useTransition();
  const inputRef = useRef(null);

  async function handleAdd(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setError("");
    const result = await onAdd(trimmed);
    setSaving(false);
    if (result.success) {
      setName("");
      inputRef.current?.focus();
    } else {
      setError(result.error || "Failed to create category.");
    }
  }

  function handleDelete(cat) {
    if (!confirm(`Delete category "${cat.name}"? This won't delete any photos.`)) return;
    start(async () => { await onDelete(cat._id); });
  }

  return (
    <div className="max-w-lg">
      <p className={`${sans.className} text-[11px] text-white/30 mb-6`}>
        Categories appear as filter tabs in the gallery. Photos must still be assigned to a category when uploading.
      </p>

      {/* Add form */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <div className="flex-1">
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            className={INPUT}
            placeholder="e.g. Swimming Pool, Events, Amenities…"
            autoComplete="off"
          />
          {error && (
            <p className={`${sans.className} text-[9px] text-red-400 mt-1`}>{error}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className={`${sans.className} shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl
            bg-[#7A2267] hover:bg-[#8a256f] text-white text-[10px] uppercase tracking-[0.15em] font-semibold
            transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <svg viewBox="0 0 14 14" width="9" height="9" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          {saving ? "Adding…" : "Add"}
        </button>
      </form>

      {/* Category list */}
      {categories.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-white/[0.08] rounded-xl">
          <p className={`${sans.className} text-[12px] text-white/25`}>No categories yet.</p>
          <p className={`${sans.className} text-[10px] text-white/15 mt-1`}>Add your first category above.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {categories.map((cat) => (
            <div key={cat._id}
              className="flex items-center justify-between px-4 py-3 rounded-xl
                border border-white/[0.06] bg-white/[0.02] group"
            >
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#7A2267]/60" />
                <p className={`${sans.className} text-[12px] text-white/70`}>{cat.name}</p>
              </div>
              <button
                onClick={() => handleDelete(cat)}
                className={`${sans.className} opacity-0 group-hover:opacity-100 py-1 px-2 rounded-lg
                  border border-red-500/15 text-red-400/40 hover:border-red-500/30 hover:text-red-400
                  text-[8px] uppercase tracking-wider transition-all duration-150`}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────────
export default function GalleryManager({ initialData, initialCategories = [] }) {
  const [photos, setPhotos]         = useState(initialData?.photos || []);
  const [categories, setCategories] = useState(initialCategories);
  const [mode, setMode]             = useState("grid");
  const [editing, setEditing]       = useState(null);
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState("");
  const [selected, setSelected]     = useState(new Set());
  const [filterCat, setFilterCat]   = useState("All");
  const [, start]                   = useTransition();

  const catNames       = categories.map((c) => c.name);
  const existingCats   = Array.from(new Set([...catNames, ...photos.map((p) => p.category).filter(Boolean)])).sort();
  const catSuggestions = existingCats;
  const allCats        = ["All", ...existingCats];
  const visible        = filterCat === "All" ? photos : photos.filter((p) => p.category === filterCat);

  const placementCounts = Object.fromEntries(
    Object.keys(PLACEMENT_SLOTS).map((key) => [key, photos.filter((p) => p.placement === key).length])
  );

  function toggleSelect(id) {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function selectAll()      { setSelected(new Set(visible.map((p) => p._id))); }
  function clearSelection() { setSelected(new Set()); }

  async function handleSave(data) {
    setSaving(true);
    setSaveError("");
    try {
      if (editing) {
        const result = await updateGalleryPhoto(editing._id, data);
        if (result?.error) { setSaveError(result.error); return; }
        setPhotos((ps) => ps.map((p) => p._id === editing._id ? { ...p, ...data } : p));
      } else {
        const result = await createGalleryPhoto(data);
        if (result?.error) { setSaveError(result.error); return; }
        setPhotos((ps) => [{ ...data, _id: result?._id || `tmp_${Date.now()}`, createdAt: new Date().toISOString() }, ...ps]);
      }
      setMode("grid"); setEditing(null);
    } catch (err) {
      setSaveError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this photo from the gallery?")) return;
    start(async () => {
      await deleteGalleryPhoto(id);
      setPhotos((ps) => ps.filter((p) => p._id !== id));
      setSelected((s) => { const n = new Set(s); n.delete(id); return n; });
    });
  }

  async function handleToggle(photo) {
    await updateGalleryPhoto(photo._id, { ...photo, isPublished: !photo.isPublished });
    setPhotos((ps) => ps.map((p) => p._id === photo._id ? { ...p, isPublished: !p.isPublished } : p));
  }

  async function handleBulkPublish(pub) {
    const ids = [...selected];
    start(async () => {
      await bulkTogglePublish(ids, pub);
      setPhotos((ps) => ps.map((p) => selected.has(p._id) ? { ...p, isPublished: pub } : p));
      clearSelection();
    });
  }

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selected.size} photo(s)?`)) return;
    start(async () => {
      await Promise.all([...selected].map((id) => deleteGalleryPhoto(id)));
      setPhotos((ps) => ps.filter((p) => !selected.has(p._id)));
      clearSelection();
    });
  }

  async function handleAddCategory(name) {
    const result = await createGalleryCategory(name);
    if (result.success) {
      setCategories((cs) => [...cs, result.category].sort((a, b) => a.name.localeCompare(b.name)));
    }
    return result;
  }

  async function handleDeleteCategory(id) {
    await deleteGalleryCategory(id);
    setCategories((cs) => cs.filter((c) => c._id !== id));
  }

  const slotSummary = Object.entries(PLACEMENT_SLOTS)
    .filter(([key]) => key !== "none")
    .map(([key, slot]) => ({ key, slot, used: placementCounts[key] || 0 }));

  const isFormMode = mode === "add" || mode === "edit";

  return (
    <div className={`${sans.className} p-5 sm:p-8 max-w-7xl`}>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[18px] font-semibold text-white/90">
            {mode === "grid"       ? "Gallery Manager"
            : mode === "add"       ? "Add Photo"
            : mode === "edit"      ? "Edit Photo"
            : "Manage Categories"}
          </h1>
          {mode === "grid" && (
            <p className="text-[11px] text-white/30 mt-0.5">
              {photos.length} photos · {categories.length} categories · homepage grid shows up to 9 placed photos
            </p>
          )}
          {mode === "categories" && (
            <p className="text-[11px] text-white/30 mt-0.5">
              {categories.length} categor{categories.length !== 1 ? "ies" : "y"} defined
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {mode === "grid" && (
            <>
              <button
                onClick={() => setMode("categories")}
                className={`${sans.className} flex items-center gap-1.5 px-4 py-2.5 rounded-xl
                  border border-white/[0.08] text-white/40 hover:text-white/70 text-[10px] uppercase tracking-[0.15em] transition-colors duration-200`}
              >
                <svg viewBox="0 0 14 14" width="9" height="9" fill="none">
                  <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                  <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                  <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                  <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                </svg>
                Categories
                {categories.length > 0 && (
                  <span className="bg-[#7A2267]/30 text-[#c084b8] text-[8px] px-1.5 py-0.5 rounded-full">
                    {categories.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setEditing(null); setSaveError(""); setMode("add"); }}
                className={`${sans.className} flex items-center gap-2 px-4 py-2.5 rounded-xl
                  bg-[#7A2267] hover:bg-[#8a256f] text-white text-[10px] uppercase tracking-[0.18em] font-semibold transition-colors duration-200`}
              >
                <svg viewBox="0 0 14 14" width="10" height="10" fill="none">
                  <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Add Photo
              </button>
            </>
          )}
          {(isFormMode || mode === "categories") && (
            <button
              onClick={() => { setMode("grid"); setEditing(null); }}
              className={`${sans.className} flex items-center gap-1.5 px-4 py-2.5 rounded-xl
                border border-white/[0.08] text-white/40 hover:text-white/70 text-[10px] uppercase tracking-[0.15em] transition-colors duration-200`}
            >
              ← Back to Gallery
            </button>
          )}
        </div>
      </div>

      {/* Slot fill summary */}
      {mode === "grid" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          {slotSummary.map(({ key, slot, used }) => (
            <div key={key} className={`flex flex-col gap-1 p-3 rounded-xl border
              ${used >= slot.maxCount ? "border-[#7A2267]/30 bg-[#7A2267]/8" : "border-white/[0.06] bg-white/[0.02]"}`}>
              <div className="flex items-center justify-between">
                <p className={`${sans.className} text-[9px] font-semibold uppercase tracking-wider text-white/60`}>{slot.label}</p>
                <span className={`${sans.className} text-[8px] font-semibold ${used >= slot.maxCount ? "text-[#c084b8]" : "text-white/25"}`}>
                  {used}/{slot.maxCount}
                </span>
              </div>
              <p className={`${sans.className} text-[8px] text-white/20`}>{slot.ratio} · {slot.gridDesc.split("·")[0].trim()}</p>
              <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden mt-1">
                <div className="h-full rounded-full bg-[#7A2267] transition-all duration-300"
                  style={{ width: `${Math.min((used / slot.maxCount) * 100, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Categories panel */}
      {mode === "categories" && (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 mb-8">
          <CategoriesPanel
            categories={categories}
            onAdd={handleAddCategory}
            onDelete={handleDeleteCategory}
          />
        </div>
      )}

      {/* Photo form */}
      {isFormMode && (
        <div className="max-w-2xl bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 mb-8">
          {saveError && (
            <div className={`${sans.className} flex items-center gap-2 px-4 py-3 mb-5 rounded-xl
              bg-red-500/10 border border-red-500/20 text-red-400 text-[11px]`}>
              <svg viewBox="0 0 14 14" width="12" height="12" fill="none" className="shrink-0">
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M7 4v3.5M7 10h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              {saveError}
            </div>
          )}
          <PhotoForm
            key={editing?._id ?? "new"}
            initial={editing || BLANK}
            onSave={handleSave}
            onCancel={() => { setMode("grid"); setEditing(null); setSaveError(""); }}
            saving={saving}
            categories={catSuggestions}
            placementCounts={placementCounts}
            editingPlacement={editing?.placement ?? null}
          />
        </div>
      )}

      {/* Grid mode */}
      {mode === "grid" && (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 flex-1 min-w-0" style={{ scrollbarWidth: "none" }}>
              {allCats.map((cat) => {
                const count = cat === "All" ? photos.length : photos.filter((p) => p.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => { setFilterCat(cat); clearSelection(); }}
                    className={`${sans.className} shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                      text-[9.5px] uppercase tracking-wider font-medium transition-all duration-150
                      ${filterCat === cat
                        ? "bg-[#7A2267]/20 border border-[#7A2267]/35 text-[#c084b8]"
                        : "border border-white/[0.07] text-white/35 hover:text-white/60 hover:border-white/18"}`}
                  >
                    {cat}
                    {count > 0 && <span className="text-[8px] opacity-60">({count})</span>}
                  </button>
                );
              })}
            </div>
            {visible.length > 0 && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={selected.size === visible.length ? clearSelection : selectAll}
                  className={`${sans.className} px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider
                    border border-white/[0.07] text-white/30 hover:text-white/55 transition-colors duration-150`}
                >
                  {selected.size === visible.length && selected.size > 0 ? "Deselect All" : "Select All"}
                </button>
                {selected.size > 0 && (
                  <>
                    <span className={`${sans.className} text-[9.5px] text-[#c084b8]`}>{selected.size} selected</span>
                    <button onClick={() => handleBulkPublish(true)}
                      className={`${sans.className} px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider border border-emerald-500/20 text-emerald-400/60 hover:text-emerald-400 transition-colors`}>
                      Publish
                    </button>
                    <button onClick={() => handleBulkPublish(false)}
                      className={`${sans.className} px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider border border-amber-500/20 text-amber-400/60 hover:text-amber-400 transition-colors`}>
                      Unpublish
                    </button>
                    <button onClick={handleBulkDelete}
                      className={`${sans.className} px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider border border-red-500/20 text-red-400/60 hover:text-red-400 transition-colors`}>
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {visible.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
                  <rect x="2" y="2" width="16" height="16" rx="2" stroke="rgba(255,255,255,0.2)" strokeWidth="1.3" />
                  <circle cx="6.5" cy="6.5" r="1.3" stroke="rgba(255,255,255,0.2)" strokeWidth="1.1" />
                  <path d="M2 13l4.5-4 3.5 3 2.5-2 5 4" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-[13px] text-white/30 mb-4">
                {filterCat === "All" ? "No photos yet." : `No photos in "${filterCat}".`}
              </p>
              <button
                onClick={() => setMode("add")}
                className={`${sans.className} px-5 py-2.5 rounded-xl bg-[#7A2267]/20 border border-[#7A2267]/30
                  text-[10px] uppercase tracking-wider text-[#c084b8] hover:bg-[#7A2267]/30 transition-colors`}
              >
                Upload First Photo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {visible.map((photo) => (
                <PhotoCard
                  key={photo._id}
                  photo={photo}
                  selected={selected.has(photo._id)}
                  onSelect={toggleSelect}
                  onEdit={(p) => { setEditing(p); setSaveError(""); setMode("edit"); }}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
