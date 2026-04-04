"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Montserrat } from "next/font/google";
import {
  createVenue,
  updateVenue,
  deleteVenue,
  getAllVenues,
} from "@/actions/wedding/venueActions";
import ImageUpload from "@/components/ui/ImageUpload";

const sans = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });

const LABEL = `${sans.className} block text-[9px] uppercase tracking-[0.18em] font-semibold text-white/35 mb-1.5`;
const INPUT = `w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3.5 py-2.5
  text-[12.5px] text-white/85 placeholder-white/20 outline-none
  focus:border-[#7A2267]/50 focus:bg-white/[0.07] transition-all duration-200`;

const BLANK = {
  name: "", capacity: "", badge: "", description: "",
  features: ["", "", "", ""],
  coverImage: "", images: [],
  isPublished: true, sortOrder: 0,
};

// ── Form Panel ────────────────────────────────────────────────────────────────
function VenueForm({ form, setForm, onSave, onCancel, isPending, isEdit }) {
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setFeature = (i, v) => {
    const feats = [...form.features];
    feats[i] = v;
    setForm((f) => ({ ...f, features: feats }));
  };
  const addFeature = () => setForm((f) => ({ ...f, features: [...f.features, ""] }));
  const removeFeature = (i) => {
    const feats = form.features.filter((_, idx) => idx !== i);
    setForm((f) => ({ ...f, features: feats }));
  };
  const addImage = (url) => setForm((f) => ({ ...f, images: [...f.images, url] }));
  const removeImage = (i) => setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));

  return (
    <div className="space-y-5">
      {/* Cover Image */}
      <div>
        <label className={LABEL}>Cover Image</label>
        <ImageUpload
          value={form.coverImage}
          onChange={(url) => setField("coverImage", url)}
        />
      </div>

      {/* Name */}
      <div>
        <label className={LABEL}>Venue Name <span className="text-[#7A2267]">*</span></label>
        <input
          className={INPUT}
          placeholder="e.g. Grand Outdoor Field"
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
        />
      </div>

      {/* Capacity & Badge */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Capacity</label>
          <input
            className={INPUT}
            placeholder="e.g. Up to 15,000"
            value={form.capacity}
            onChange={(e) => setField("capacity", e.target.value)}
          />
        </div>
        <div>
          <label className={LABEL}>Badge (optional)</label>
          <input
            className={INPUT}
            placeholder="e.g. Most Popular"
            value={form.badge}
            onChange={(e) => setField("badge", e.target.value)}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={LABEL}>Description</label>
        <textarea
          className={`${INPUT} resize-none`}
          rows={3}
          placeholder="Describe this venue…"
          value={form.description}
          onChange={(e) => setField("description", e.target.value)}
        />
      </div>

      {/* Features */}
      <div>
        <label className={LABEL}>Features / Highlights</label>
        <div className="space-y-2">
          {form.features.map((feat, i) => (
            <div key={i} className="flex gap-2">
              <input
                className={INPUT}
                placeholder={`Feature ${i + 1}`}
                value={feat}
                onChange={(e) => setFeature(i, e.target.value)}
              />
              {form.features.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeFeature(i)}
                  className="px-3 rounded-xl bg-white/[0.04] hover:bg-red-500/15 text-white/30
                    hover:text-red-400 border border-white/[0.08] transition-all duration-200 text-xs"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addFeature}
            className={`${sans.className} text-[10px] text-[#C9956C]/60 hover:text-[#C9956C]
              uppercase tracking-[0.15em] font-semibold transition-colors duration-200`}
          >
            + Add Feature
          </button>
        </div>
      </div>

      {/* Gallery Images */}
      <div>
        <label className={LABEL}>Gallery Images</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {form.images.map((img, i) => (
            <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden group">
              <Image src={img} alt="" fill className="object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100
                  transition-opacity flex items-center justify-center text-white text-lg"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <ImageUpload
          value=""
          onChange={(url) => { if (url) addImage(url); }}
        />
        <p className={`${sans.className} text-[9px] text-white/25 mt-1.5`}>
          Upload additional gallery photos for the venue detail page.
        </p>
      </div>

      {/* Sort order & Publish */}
      <div className="flex items-center gap-4">
        <div className="w-28">
          <label className={LABEL}>Sort Order</label>
          <input
            type="number"
            className={INPUT}
            value={form.sortOrder}
            onChange={(e) => setField("sortOrder", e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 mt-4">
          <button
            type="button"
            onClick={() => setField("isPublished", !form.isPublished)}
            className={`relative w-9 h-5 rounded-full transition-colors duration-200
              ${form.isPublished ? "bg-[#7A2267]" : "bg-white/10"}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200
              ${form.isPublished ? "left-4.5" : "left-0.5"}`} />
          </button>
          <span className={`${sans.className} text-[11px] text-white/45`}>
            {form.isPublished ? "Published" : "Draft"}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onSave}
          disabled={isPending}
          className={`${sans.className} flex-1 py-2.5 rounded-xl text-[11px] font-semibold
            uppercase tracking-[0.15em] text-white transition-all duration-200
            ${isPending ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"}
            bg-gradient-to-r from-[#7A2267] to-[#9A3087]`}
        >
          {isPending ? "Saving…" : isEdit ? "Update Venue" : "Create Venue"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={`${sans.className} px-5 py-2.5 rounded-xl text-[11px] font-semibold
            uppercase tracking-[0.15em] text-white/40 border border-white/[0.08]
            hover:text-white/70 hover:bg-white/[0.04] transition-all duration-200`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main Manager ──────────────────────────────────────────────────────────────
export default function WeddingVenueManager({ initialVenues = [] }) {
  const [venues, setVenues]     = useState(initialVenues);
  const [panel, setPanel]       = useState(null); // null | "create" | { id, ...venue }
  const [form, setForm]         = useState(BLANK);
  const [isPending, startTr]    = useTransition();
  const [confirmDel, setConfirmDel] = useState(null);
  const [msg, setMsg]           = useState(null);

  const flash = (text, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3500);
  };

  const reload = async () => {
    const fresh = await getAllVenues();
    setVenues(fresh);
  };

  function openCreate() {
    setForm({ ...BLANK, features: ["", "", "", ""] });
    setPanel("create");
  }

  function openEdit(v) {
    setForm({
      name: v.name, capacity: v.capacity, badge: v.badge,
      description: v.description,
      features: v.features?.length ? [...v.features, ""] : ["", "", "", ""],
      coverImage: v.coverImage, images: v.images || [],
      isPublished: v.isPublished, sortOrder: v.sortOrder,
    });
    setPanel({ id: v._id });
  }

  function handleSave() {
    startTr(async () => {
      const data = {
        ...form,
        features: form.features.filter((f) => f.trim()),
      };
      let res;
      if (panel === "create") {
        res = await createVenue(data);
      } else {
        res = await updateVenue(panel.id, data);
      }
      if (res.success) {
        flash(panel === "create" ? "Venue created!" : "Venue updated!");
        setPanel(null);
        await reload();
      } else {
        flash(res.error || "Error saving venue.", false);
      }
    });
  }

  function handleDelete(id) {
    startTr(async () => {
      const res = await deleteVenue(id);
      if (res.success) {
        flash("Venue deleted.");
        setConfirmDel(null);
        await reload();
      } else {
        flash("Error deleting venue.", false);
      }
    });
  }

  return (
    <div className={`${sans.className} min-h-screen bg-[#0a0a0a] text-white`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-[1.4rem] font-semibold text-white/90 leading-tight">
              Wedding Venues
            </h1>
            <p className="text-[11px] text-white/30 mt-1">
              {venues.length} venue{venues.length !== 1 ? "s" : ""} · Manage and publish
            </p>
          </div>
          {!panel && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-semibold
                uppercase tracking-[0.15em] text-white bg-[#7A2267] hover:bg-[#9A3087]
                transition-colors duration-200"
            >
              <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
                <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              Add Venue
            </button>
          )}
        </div>

        {/* Flash message */}
        {msg && (
          <div className={`mb-5 px-4 py-3 rounded-xl text-[11.5px] font-medium
            ${msg.ok ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                     : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
            {msg.text}
          </div>
        )}

        {/* Side panel for create/edit */}
        {panel && (
          <div className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
            <h2 className="text-[13px] font-semibold text-white/80 mb-6 uppercase tracking-[0.1em]">
              {panel === "create" ? "New Venue" : "Edit Venue"}
            </h2>
            <VenueForm
              form={form}
              setForm={setForm}
              onSave={handleSave}
              onCancel={() => setPanel(null)}
              isPending={isPending}
              isEdit={panel !== "create"}
            />
          </div>
        )}

        {/* Venue grid */}
        {venues.length === 0 ? (
          <div className="text-center py-20 text-white/20 text-[13px]">
            No venues yet. Click "Add Venue" to create the first one.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {venues.map((v) => (
              <div
                key={v._id}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.025] overflow-hidden
                  hover:border-white/15 transition-all duration-200"
              >
                {/* Cover */}
                <div className="relative h-36 bg-white/[0.04]">
                  {v.coverImage ? (
                    <Image src={v.coverImage} alt={v.name} fill className="object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white/10 text-[11px] uppercase tracking-widest">
                      No Image
                    </div>
                  )}
                  {/* Status badge */}
                  <div className={`absolute top-2 right-2 text-[8px] font-semibold uppercase tracking-[0.15em]
                    px-2 py-0.5 rounded-full
                    ${v.isPublished
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-white/10 text-white/30 border border-white/10"}`}>
                    {v.isPublished ? "Live" : "Draft"}
                  </div>
                  {v.badge && (
                    <div className="absolute top-2 left-2 bg-[#C9956C] text-[#0e0710] text-[7px] font-bold
                      px-2 py-0.5 rounded-full uppercase tracking-[0.12em]">
                      {v.badge}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="text-[13px] font-semibold text-white/85 leading-tight">{v.name}</h3>
                    {v.capacity && (
                      <span className="text-[9px] text-[#C9956C] bg-[#C9956C]/10 border border-[#C9956C]/20
                        px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                        {v.capacity}
                      </span>
                    )}
                  </div>
                  {v.description && (
                    <p className="text-[11px] text-white/30 leading-relaxed mb-3 line-clamp-2">{v.description}</p>
                  )}
                  {v.features?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {v.features.slice(0, 3).map((f, i) => (
                        <span key={i} className="text-[9px] text-[#C9956C]/50 bg-[#C9956C]/[0.06]
                          border border-[#C9956C]/10 px-2 py-0.5 rounded-full">
                          {f}
                        </span>
                      ))}
                      {v.features.length > 3 && (
                        <span className="text-[9px] text-white/20 px-2 py-0.5">
                          +{v.features.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(v)}
                      className="flex-1 py-2 rounded-xl text-[10px] font-semibold uppercase
                        tracking-[0.12em] text-white/50 border border-white/[0.08]
                        hover:text-white hover:bg-white/[0.04] transition-all duration-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDel(v._id)}
                      className="px-3 py-2 rounded-xl text-[10px] font-semibold uppercase
                        tracking-[0.12em] text-red-400/50 border border-red-500/10
                        hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Confirm Delete Modal */}
        {confirmDel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-[14px] font-semibold text-white mb-2">Delete Venue?</h3>
              <p className="text-[12px] text-white/40 mb-5">
                This will permanently remove this venue. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDelete(confirmDel)}
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl text-[11px] font-semibold uppercase
                    tracking-[0.12em] text-white bg-red-600 hover:bg-red-500
                    transition-colors duration-200 disabled:opacity-50"
                >
                  {isPending ? "Deleting…" : "Yes, Delete"}
                </button>
                <button
                  onClick={() => setConfirmDel(null)}
                  className="flex-1 py-2.5 rounded-xl text-[11px] font-semibold uppercase
                    tracking-[0.12em] text-white/50 border border-white/[0.08]
                    hover:text-white hover:bg-white/[0.04] transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
