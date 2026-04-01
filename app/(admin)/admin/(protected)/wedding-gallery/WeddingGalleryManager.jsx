"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { Montserrat } from "next/font/google";
import {
  createWeddingPhoto,
  updateWeddingPhoto,
  deleteWeddingPhoto,
  bulkToggleWeddingPublish,
  getAllWeddingPhotos,
} from "@/actions/wedding/weddingActions";
import ImageUpload from "@/components/ui/ImageUpload";

const sans = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });

const LABEL = `${sans.className} block text-[9px] uppercase tracking-[0.18em] font-semibold text-white/35 mb-1.5`;
const INPUT = `w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3.5 py-2.5
  text-[12.5px] text-white/85 placeholder-white/20 outline-none
  focus:border-[#7A2267]/50 focus:bg-white/[0.07] transition-all duration-200`;

const CATEGORIES = ["Ceremony", "Reception", "Holud · Mehndi", "Venue", "Décor", "General"];
const SPANS = [
  { value: "none",  label: "Square",    ratio: "1:1",  preview: <div className="w-7 h-7 rounded bg-white/10 border border-white/15" /> },
  { value: "row",   label: "Portrait",  ratio: "3:4",  preview: <div className="w-[21px] h-7 rounded bg-white/10 border border-white/15" /> },
  { value: "col",   label: "Landscape", ratio: "4:3",  preview: <div className="w-10 h-[30px] rounded bg-white/10 border border-white/15" /> },
];

const BLANK = { title: "", image: "", altText: "", category: "General", span: "none", isPublished: true, sortOrder: 0 };

const CARD_BASE = "relative flex flex-col items-center p-3 rounded-xl border text-center transition-all duration-200 cursor-pointer";
const CARD_ON   = "border-[#7A2267]/60 bg-[#7A2267]/15 ring-1 ring-[#7A2267]/25";
const CARD_OFF  = "border-white/[0.08] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]";

// ── Form panel ────────────────────────────────────────────────────────────────
function PhotoForm({ form, setForm, onSave, onCancel, isPending, isEdit }) {
  return (
    <div className="space-y-4">
      {/* Image upload */}
      <div>
        <label className={LABEL}>Photo <span className="text-[#7A2267]">*</span></label>
        <ImageUpload
          value={form.image}
          onChange={(url) => setForm((f) => ({ ...f, image: url }))}
        />
      </div>

      {/* Title */}
      <div>
        <label className={LABEL}>Title</label>
        <input
          className={INPUT}
          placeholder="e.g. Garden Nikah Setup"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
      </div>

      {/* Alt text */}
      <div>
        <label className={LABEL}>Alt Text</label>
        <input
          className={INPUT}
          placeholder="Describe the photo for accessibility"
          value={form.altText}
          onChange={(e) => setForm((f) => ({ ...f, altText: e.target.value }))}
        />
      </div>

      {/* Category */}
      <div>
        <label className={LABEL}>Category</label>
        <select
          className={INPUT}
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="bg-[#111]">{c}</option>
          ))}
        </select>
      </div>

      {/* Span / aspect ratio */}
      <div>
        <label className={LABEL}>Aspect Ratio <span className="text-white/20 normal-case font-normal ml-1">— how it appears in the masonry gallery</span></label>
        <div className="grid grid-cols-3 gap-2">
          {SPANS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, span: s.value }))}
              className={`${CARD_BASE} ${form.span === s.value ? CARD_ON : CARD_OFF}`}
            >
              <div className="w-full flex justify-center items-center h-8 mb-2">{s.preview}</div>
              <p className={`${sans.className} text-[10px] font-semibold text-white/80 leading-none mb-0.5`}>{s.label}</p>
              <p className={`${sans.className} text-[8px] text-[#c084b8] font-medium`}>{s.ratio}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Sort + Published row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Sort Order</label>
          <input
            type="number"
            className={INPUT}
            placeholder="0"
            value={form.sortOrder}
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
          />
        </div>
        <div className="flex flex-col justify-end pb-0.5">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <div
              onClick={() => setForm((f) => ({ ...f, isPublished: !f.isPublished }))}
              className={`relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0
                ${form.isPublished ? "bg-[#7A2267]" : "bg-white/10"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow
                transition-transform duration-200 ${form.isPublished ? "translate-x-4" : "translate-x-0"}`} />
            </div>
            <span className={`${sans.className} text-[11px] text-white/55`}>
              {form.isPublished ? "Published" : "Hidden"}
            </span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          disabled={isPending || !form.image}
          onClick={onSave}
          className={`${sans.className} flex-1 py-2.5 rounded-xl text-[11px] font-semibold
            uppercase tracking-[0.12em] transition-all duration-200
            ${isPending || !form.image
              ? "bg-white/[0.05] text-white/25 cursor-not-allowed"
              : "bg-[#7A2267] hover:bg-[#8a256f] text-white shadow-[0_4px_14px_rgba(122,34,103,0.3)]"
            }`}
        >
          {isPending ? "Saving…" : isEdit ? "Update Photo" : "Add Photo"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={`${sans.className} px-5 py-2.5 rounded-xl text-[11px] font-semibold
            uppercase tracking-[0.12em] border border-white/[0.08] text-white/35
            hover:text-white/65 hover:border-white/20 transition-all duration-200`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function WeddingGalleryManager({ initialData }) {
  const [data, setData]           = useState(initialData);
  const [form, setForm]           = useState(BLANK);
  const [editingId, setEditingId] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selected, setSelected]   = useState(new Set());
  const [filterCat, setFilterCat] = useState("All");
  const [error, setError]         = useState("");
  const [toast, setToast]         = useState("");
  const [isPending, startTransition] = useTransition();

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const openAdd = () => {
    setForm(BLANK);
    setEditingId(null);
    setPanelOpen(true);
    setError("");
  };

  const openEdit = (photo) => {
    setForm({
      title:       photo.title || "",
      image:       photo.image || "",
      altText:     photo.altText || "",
      category:    photo.category || "General",
      span:        photo.span || "none",
      isPublished: photo.isPublished ?? true,
      sortOrder:   photo.sortOrder ?? 0,
    });
    setEditingId(photo._id);
    setPanelOpen(true);
    setError("");
  };

  const closePanel = () => {
    setPanelOpen(false);
    setEditingId(null);
    setForm(BLANK);
    setError("");
  };

  const refresh = async () => {
    const fresh = await getAllWeddingPhotos({ page: data.page, limit: data.limit });
    setData(fresh);
  };

  const handleSave = () => {
    if (!form.image) { setError("Please upload a photo."); return; }
    setError("");
    startTransition(async () => {
      const result = editingId
        ? await updateWeddingPhoto(editingId, form)
        : await createWeddingPhoto(form);
      if (!result.success) { setError(result.error || "Something went wrong."); return; }
      await refresh();
      closePanel();
      showToast(editingId ? "Photo updated." : "Photo added.");
    });
  };

  const handleDelete = (id) => {
    if (!confirm("Delete this photo?")) return;
    startTransition(async () => {
      await deleteWeddingPhoto(id);
      await refresh();
      showToast("Photo deleted.");
    });
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkToggle = (pub) => {
    if (!selected.size) return;
    startTransition(async () => {
      await bulkToggleWeddingPublish([...selected], pub);
      await refresh();
      setSelected(new Set());
      showToast(`${selected.size} photo(s) ${pub ? "published" : "hidden"}.`);
    });
  };

  const ALL_CATS = ["All", ...CATEGORIES];
  const photos = filterCat === "All"
    ? data.photos
    : data.photos.filter((p) => p.category === filterCat);

  return (
    <div className={`${sans.className} min-h-screen bg-[#0d0d0d] text-white`}>
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999]
          bg-[#7A2267] text-white text-[11px] font-semibold px-5 py-2.5 rounded-full shadow-lg
          animate-fade-in">
          {toast}
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-[20px] font-semibold text-white/90 mb-1">Wedding Gallery</h1>
            <p className="text-[12px] text-white/30">
              {data.total} photo{data.total !== 1 ? "s" : ""} · destination wedding page
            </p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7A2267] hover:bg-[#8a256f]
              text-white text-[11px] font-semibold uppercase tracking-[0.12em] transition-all duration-200
              shadow-[0_4px_14px_rgba(122,34,103,0.3)]"
          >
            <svg viewBox="0 0 14 14" width="12" height="12" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Add Photo
          </button>
        </div>

        {/* Category filter tabs */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {ALL_CATS.map((c) => (
            <button
              key={c}
              onClick={() => setFilterCat(c)}
              className={`text-[9px] uppercase tracking-[0.15em] font-semibold px-3.5 py-1.5 rounded-full
                border transition-all duration-200
                ${filterCat === c
                  ? "border-[#7A2267]/60 bg-[#7A2267]/20 text-[#c084b8]"
                  : "border-white/[0.08] text-white/30 hover:text-white/55 hover:border-white/20"
                }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Bulk toolbar */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 mb-4 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07]">
            <span className="text-[11px] text-white/45">{selected.size} selected</span>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => handleBulkToggle(true)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20
                  text-[10px] font-semibold uppercase tracking-[0.1em] hover:bg-emerald-500/25 transition-colors"
              >
                Publish
              </button>
              <button
                onClick={() => handleBulkToggle(false)}
                className="px-3.5 py-1.5 rounded-lg bg-white/[0.05] text-white/40 border border-white/[0.07]
                  text-[10px] font-semibold uppercase tracking-[0.1em] hover:bg-white/[0.09] transition-colors"
              >
                Hide
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="px-3.5 py-1.5 rounded-lg text-white/25 text-[10px] font-semibold
                  uppercase tracking-[0.1em] hover:text-white/50 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-6">
          {/* Grid */}
          <div className="flex-1 min-w-0">
            {photos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.07]
                  flex items-center justify-center mb-4">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
                    strokeWidth="1.3" className="text-white/20">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
                <p className="text-[13px] text-white/30 font-medium mb-1">No photos yet</p>
                <p className="text-[11px] text-white/18">Click "Add Photo" to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                {photos.map((photo) => {
                  const isSel = selected.has(photo._id);
                  return (
                    <div
                      key={photo._id}
                      className={`group relative rounded-xl overflow-hidden border transition-all duration-200
                        ${isSel
                          ? "border-[#7A2267]/60 ring-1 ring-[#7A2267]/25"
                          : "border-white/[0.07] hover:border-white/20"
                        }`}
                    >
                      {/* Thumbnail */}
                      <div
                        className={`relative bg-white/[0.04] cursor-pointer
                          ${photo.span === "row" ? "aspect-[3/4]" : photo.span === "col" ? "aspect-[4/3]" : "aspect-square"}`}
                        onClick={() => toggleSelect(photo._id)}
                      >
                        <Image
                          src={photo.image}
                          alt={photo.altText || photo.title || "Wedding photo"}
                          fill
                          className="object-cover"
                          sizes="(max-width:640px) 50vw, (max-width:1280px) 25vw, 20vw"
                        />
                        {/* Overlay on hover/select */}
                        <div className={`absolute inset-0 transition-opacity duration-200
                          ${isSel ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
                          bg-black/40 flex items-center justify-center`}>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                            ${isSel ? "bg-[#7A2267] border-[#7A2267]" : "border-white/70 bg-white/10"}`}>
                            {isSel && (
                              <svg viewBox="0 0 10 10" width="10" height="10" fill="none">
                                <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                        </div>

                        {/* Published badge */}
                        {!photo.isPublished && (
                          <span className="absolute top-2 left-2 bg-black/60 text-white/50 text-[8px]
                            font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur-sm">
                            Hidden
                          </span>
                        )}

                        {/* Category pill */}
                        <span className="absolute bottom-2 left-2 bg-black/55 text-white/65 text-[8px]
                          font-medium px-2 py-0.5 rounded-full backdrop-blur-sm">
                          {photo.category}
                        </span>
                      </div>

                      {/* Card footer */}
                      <div className="px-2.5 py-2 bg-white/[0.02] border-t border-white/[0.05]">
                        <p className="text-[10.5px] text-white/60 truncate leading-tight mb-2">
                          {photo.title || <span className="italic text-white/25">No title</span>}
                        </p>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openEdit(photo)}
                            className="flex-1 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.09]
                              text-white/40 hover:text-white/70 text-[9px] font-semibold uppercase
                              tracking-[0.1em] transition-all duration-150"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(photo._id)}
                            className="flex-1 py-1 rounded-lg bg-red-500/[0.07] hover:bg-red-500/15
                              text-red-400/60 hover:text-red-400 text-[9px] font-semibold uppercase
                              tracking-[0.1em] transition-all duration-150"
                          >
                            Del
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Form panel */}
          {panelOpen && (
            <div className="w-[320px] xl:w-[360px] flex-shrink-0">
              <div className="sticky top-6 rounded-2xl bg-white/[0.03] border border-white/[0.07] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[13px] font-semibold text-white/75">
                    {editingId ? "Edit Photo" : "Add Photo"}
                  </h2>
                  <button
                    onClick={closePanel}
                    className="p-1.5 rounded-lg text-white/25 hover:text-white/60
                      hover:bg-white/[0.05] transition-all duration-150"
                  >
                    <svg viewBox="0 0 14 14" width="12" height="12" fill="none">
                      <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>

                {error && (
                  <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20
                    text-[11px] text-red-400 font-medium">
                    {error}
                  </div>
                )}

                <PhotoForm
                  form={form}
                  setForm={setForm}
                  onSave={handleSave}
                  onCancel={closePanel}
                  isPending={isPending}
                  isEdit={!!editingId}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
