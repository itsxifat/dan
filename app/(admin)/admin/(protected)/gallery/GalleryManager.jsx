"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Montserrat } from "next/font/google";
import {
  createGalleryPhoto,
  updateGalleryPhoto,
  deleteGalleryPhoto,
  bulkTogglePublish,
} from "@/actions/gallery/galleryActions";
import { GALLERY_CATEGORY_SUGGESTIONS } from "@/lib/galleryConstants";
import ImageUpload from "@/components/ui/ImageUpload";

const sans = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });

const LABEL = `${sans.className} block text-[9px] uppercase tracking-[0.18em] font-semibold text-white/35 mb-1.5`;
const INPUT = `w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3.5 py-2.5
  text-[12.5px] text-white/85 placeholder-white/20 outline-none
  focus:border-[#7A2267]/50 focus:bg-white/[0.07] transition-all duration-200`;

const BLANK = { title: "", image: "", altText: "", category: "General", isPublished: true, sortOrder: 0 };

// ── Upload / Edit form ─────────────────────────────────────────────────────────
function PhotoForm({ initial = BLANK, onSave, onCancel, saving, categories = [] }) {
  const [form, setForm] = useState({ ...BLANK, ...initial });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function handleSubmit(e) {
    e.preventDefault();
    onSave({ ...form, sortOrder: Number(form.sortOrder) || 0 });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Image upload */}
      <div>
        <label className={LABEL}>Photo <span className="text-[#7A2267]">*</span></label>
        <ImageUpload
          value={form.image}
          onChange={(url) => setForm((f) => ({ ...f, image: url }))}
          dark
        />
      </div>

      {/* Title + Alt */}
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

      {/* Category + Sort */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Category <span className="text-[#7A2267]">*</span></label>
          <input
            list="gallery-cat-list"
            className={INPUT}
            value={form.category}
            onChange={set("category")}
            placeholder="e.g. Nature, Events…"
            autoComplete="off"
          />
          <datalist id="gallery-cat-list">
            {categories.map((c) => <option key={c} value={c} />)}
          </datalist>
          <p className={`${sans.className} text-[8.5px] text-white/25 mt-1`}>
            Type a new category or pick an existing one
          </p>
        </div>
        <div>
          <label className={LABEL}>Sort Order</label>
          <input type="number" className={INPUT} min="0" value={form.sortOrder} onChange={set("sortOrder")} placeholder="0" />
        </div>
      </div>

      {/* Published toggle */}
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
          {form.isPublished ? "Published — visible on homepage" : "Draft — hidden from homepage"}
        </span>
      </div>

      {/* Actions */}
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

  return (
    <div className={`group relative rounded-xl overflow-hidden bg-white/[0.04]
      border transition-all duration-200 cursor-pointer
      ${selected ? "border-[#7A2267]/60 ring-1 ring-[#7A2267]/30" : "border-white/[0.06] hover:border-white/[0.15]"}`}
    >
      {/* Select checkbox */}
      <button
        onClick={() => onSelect(photo._id)}
        className={`absolute top-2 left-2 z-10 w-5 h-5 rounded-md border flex items-center justify-center
          transition-all duration-150
          ${selected
            ? "bg-[#7A2267] border-[#7A2267]"
            : "bg-black/30 border-white/20 opacity-0 group-hover:opacity-100 backdrop-blur-sm"
          }`}
      >
        {selected && (
          <svg viewBox="0 0 10 8" width="8" height="8" fill="none">
            <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Published badge */}
      <div className="absolute top-2 right-2 z-10">
        <span className={`${sans.className} text-[7.5px] uppercase tracking-wider font-semibold
          px-1.5 py-0.5 rounded-full
          ${photo.isPublished
            ? "bg-emerald-400/20 text-emerald-400 border border-emerald-400/25"
            : "bg-white/10 text-white/35 border border-white/10"
          }`}>
          {photo.isPublished ? "Live" : "Draft"}
        </span>
      </div>

      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-white/[0.03]">
        {photo.image ? (
          <Image
            src={photo.image}
            alt={photo.altText || photo.title || "Gallery photo"}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
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

      {/* Info */}
      <div className="px-3 py-2.5">
        <p className={`${sans.className} text-[11px] font-medium text-white/75 truncate`}>
          {photo.title || <span className="text-white/25 italic">Untitled</span>}
        </p>
        <p className={`${sans.className} text-[9px] uppercase tracking-wider text-white/30 mt-0.5`}>
          {photo.category}
        </p>
      </div>

      {/* Action row */}
      <div className="flex items-center gap-1.5 px-3 pb-3">
        <button
          onClick={() => onEdit(photo)}
          className={`${sans.className} flex-1 py-1.5 rounded-lg text-[9px] uppercase tracking-wider
            border border-white/[0.07] text-white/35 hover:text-white/65 hover:border-white/18
            transition-colors duration-150`}
        >
          Edit
        </button>
        <button
          onClick={() => start(async () => { await onToggle(photo); })}
          className={`${sans.className} flex-1 py-1.5 rounded-lg text-[9px] uppercase tracking-wider
            border transition-colors duration-150
            ${photo.isPublished
              ? "border-amber-500/15 text-amber-400/50 hover:border-amber-500/30 hover:text-amber-400"
              : "border-emerald-500/15 text-emerald-400/50 hover:border-emerald-500/30 hover:text-emerald-400"
            }`}
        >
          {photo.isPublished ? "Hide" : "Show"}
        </button>
        <button
          onClick={() => onDelete(photo._id)}
          className={`${sans.className} py-1.5 px-2 rounded-lg
            border border-red-500/15 text-red-400/40 hover:border-red-500/30 hover:text-red-400
            transition-colors duration-150`}
        >
          <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
            <path d="M1.5 3h9M4 3V2h4v1M3 3l.6 7.5h4.8L9 3"
              stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────────
export default function GalleryManager({ initialData }) {
  const [photos, setPhotos]   = useState(initialData?.photos || []);
  const [mode, setMode]       = useState("grid"); // grid | add | edit
  const [editing, setEditing] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [filterCat, setFilterCat] = useState("All");
  const [, start]             = useTransition();

  // Derive categories from actual photos + defaults as suggestions
  const existingCats = Array.from(new Set(photos.map((p) => p.category).filter(Boolean))).sort();
  const catSuggestions = Array.from(new Set([...GALLERY_CATEGORY_SUGGESTIONS, ...existingCats])).sort();
  const allCats = ["All", ...existingCats];
  const visible = filterCat === "All" ? photos : photos.filter((p) => p.category === filterCat);

  // Selection
  function toggleSelect(id) {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }
  function selectAll() {
    setSelected(new Set(visible.map((p) => p._id)));
  }
  function clearSelection() { setSelected(new Set()); }

  // Save (create or update)
  async function handleSave(data) {
    setSaving(true);
    try {
      if (editing) {
        await updateGalleryPhoto(editing._id, data);
        setPhotos((ps) => ps.map((p) => p._id === editing._id ? { ...p, ...data } : p));
      } else {
        await createGalleryPhoto(data);
        setPhotos((ps) => [{ ...data, _id: `tmp_${Date.now()}`, createdAt: new Date().toISOString() }, ...ps]);
      }
      setMode("grid");
      setEditing(null);
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
    const updated = { ...photo, isPublished: !photo.isPublished };
    await updateGalleryPhoto(photo._id, updated);
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

  return (
    <div className={`${sans.className} p-5 sm:p-8 max-w-7xl`}>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[18px] font-semibold text-white/90">
            {mode === "grid" ? "Gallery Manager" : mode === "add" ? "Add Photo" : "Edit Photo"}
          </h1>
          {mode === "grid" && (
            <p className="text-[11px] text-white/30 mt-0.5">
              {photos.length} total · {photos.filter((p) => p.isPublished).length} live
            </p>
          )}
        </div>

        {mode === "grid" ? (
          <button
            onClick={() => { setEditing(null); setMode("add"); }}
            className={`${sans.className} flex items-center gap-2 px-4 py-2.5 rounded-xl
              bg-[#7A2267] hover:bg-[#8a256f] text-white
              text-[10px] uppercase tracking-[0.18em] font-semibold transition-colors duration-200`}
          >
            <svg viewBox="0 0 14 14" width="10" height="10" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Add Photo
          </button>
        ) : (
          <button
            onClick={() => { setMode("grid"); setEditing(null); }}
            className={`${sans.className} flex items-center gap-1.5 px-4 py-2.5 rounded-xl
              border border-white/[0.08] text-white/40 hover:text-white/70
              text-[10px] uppercase tracking-[0.15em] transition-colors duration-200`}
          >
            ← Back to Gallery
          </button>
        )}
      </div>

      {/* Form panel */}
      {mode !== "grid" && (
        <div className="max-w-xl bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 mb-8">
          <PhotoForm
            initial={editing || BLANK}
            onSave={handleSave}
            onCancel={() => { setMode("grid"); setEditing(null); }}
            saving={saving}
            categories={catSuggestions}
          />
        </div>
      )}

      {/* Grid mode */}
      {mode === "grid" && (
        <>
          {/* Category filter + bulk actions bar */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {/* Category tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 flex-1 min-w-0"
              style={{ scrollbarWidth: "none" }}>
              {allCats.map((cat) => {
                const count = cat === "All"
                  ? photos.length
                  : photos.filter((p) => p.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => { setFilterCat(cat); clearSelection(); }}
                    className={`${sans.className} shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                      text-[9.5px] uppercase tracking-wider font-medium transition-all duration-150
                      ${filterCat === cat
                        ? "bg-[#7A2267]/20 border border-[#7A2267]/35 text-[#c084b8]"
                        : "border border-white/[0.07] text-white/35 hover:text-white/60 hover:border-white/18"
                      }`}
                  >
                    {cat}
                    {count > 0 && (
                      <span className="text-[8px] opacity-60">({count})</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Select all / bulk actions */}
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
                    <span className={`${sans.className} text-[9.5px] text-[#c084b8]`}>
                      {selected.size} selected
                    </span>
                    <button
                      onClick={() => handleBulkPublish(true)}
                      className={`${sans.className} px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider
                        border border-emerald-500/20 text-emerald-400/60 hover:text-emerald-400 transition-colors`}
                    >
                      Publish
                    </button>
                    <button
                      onClick={() => handleBulkPublish(false)}
                      className={`${sans.className} px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider
                        border border-amber-500/20 text-amber-400/60 hover:text-amber-400 transition-colors`}
                    >
                      Unpublish
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className={`${sans.className} px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider
                        border border-red-500/20 text-red-400/60 hover:text-red-400 transition-colors`}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Photo grid */}
          {visible.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.06]
                flex items-center justify-center mx-auto mb-4">
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
                className={`${sans.className} px-5 py-2.5 rounded-xl bg-[#7A2267]/20
                  border border-[#7A2267]/30 text-[10px] uppercase tracking-wider text-[#c084b8]
                  hover:bg-[#7A2267]/30 transition-colors`}
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
                  onEdit={(p) => { setEditing(p); setMode("edit"); }}
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
