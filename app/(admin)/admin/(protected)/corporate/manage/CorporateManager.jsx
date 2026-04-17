"use client";

import { useState, useTransition, lazy, Suspense } from "react";
import { Montserrat, Playfair_Display } from "next/font/google";
import {
  createCorporateEvent, updateCorporateEvent, deleteCorporateEvent,
  createCorporateVenue, updateCorporateVenue, deleteCorporateVenue,
  createCorporateBrand, updateCorporateBrand, deleteCorporateBrand,
} from "@/actions/corporate/corporateActions";
import ImageUpload from "@/components/ui/ImageUpload";

const MediaPicker = lazy(() => import("@/components/admin/MediaPicker"));

const sans     = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600"] });

// ── Design tokens ─────────────────────────────────────────────────────────────
const LABEL = `${sans.className} block text-[9px] uppercase tracking-[0.2em] font-semibold text-white/35 mb-1.5`;
const INPUT = `w-full bg-[#111] border border-white/[0.07] rounded-xl px-3.5 py-2.5
  text-[12.5px] text-white/85 placeholder-white/20 outline-none
  focus:border-[#7A2267]/60 focus:bg-[#151515] transition-all duration-200`;
const SELECT = `w-full bg-[#111] border border-white/[0.07] rounded-xl px-3.5 py-2.5
  text-[12.5px] text-white/85 outline-none
  focus:border-[#7A2267]/60 transition-all duration-200
  [&>option]:bg-[#111] [&>option]:text-white`;

// ── Shared: multi-image gallery picker ───────────────────────────────────────
function GalleryPicker({ images, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {images.map((url, i) => (
          <div key={i} className="relative group w-[72px] h-[72px] rounded-lg overflow-hidden border border-white/[0.07]">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-black/55">
              <button type="button" onClick={() => onChange(images.filter((_, j) => j !== i))}
                className="w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white transition-colors">
                <svg viewBox="0 0 10 10" width="8" height="8" fill="none">
                  <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => setOpen(true)}
          className="w-[72px] h-[72px] rounded-lg border border-dashed border-white/[0.12] hover:border-[#7A2267]/50
            flex flex-col items-center justify-center gap-1 text-white/25 hover:text-white/55 transition-all duration-200">
          <svg viewBox="0 0 14 14" width="14" height="14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span className={`${sans.className} text-[8px] uppercase tracking-wider`}>Add</span>
        </button>
      </div>
      {open && (
        <Suspense fallback={null}>
          <MediaPicker open={open} onClose={() => setOpen(false)}
            onSelect={(url) => { onChange([...images, url]); setOpen(false); }} />
        </Suspense>
      )}
    </div>
  );
}

// ── Shared: toggle ────────────────────────────────────────────────────────────
function Toggle({ value, onChange, label }) {
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-full shrink-0 transition-colors duration-200 ${value ? "bg-[#7A2267]" : "bg-white/[0.08]"}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${value ? "left-[22px]" : "left-0.5"}`} />
      </button>
      <span className={`${sans.className} text-[11px] text-white/50`}>{label}</span>
    </div>
  );
}

// ── Shared: form save/cancel buttons ─────────────────────────────────────────
function SaveBar({ saving, label, onCancel, disabled }) {
  return (
    <div className="flex items-center gap-2 pt-2 border-t border-white/[0.05] mt-2">
      <button type="submit" disabled={saving || disabled}
        className={`${sans.className} flex items-center gap-2 px-6 py-2.5 rounded-xl
          bg-[#7A2267] hover:bg-[#8e2578] text-white font-semibold
          text-[10px] uppercase tracking-[0.18em] transition-all duration-200
          disabled:opacity-40 disabled:cursor-not-allowed`}>
        {saving ? "Saving…" : label}
      </button>
      <button type="button" onClick={onCancel}
        className={`${sans.className} px-4 py-2.5 rounded-xl border border-white/[0.07]
          text-[10px] uppercase tracking-[0.15em] text-white/35 hover:text-white/65 transition-colors duration-200`}>
        Cancel
      </button>
    </div>
  );
}

// ── Shared: item action row ───────────────────────────────────────────────────
function ItemActions({ onEdit, onDelete, onToggle, isPublished, isPending }) {
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={onEdit}
        className={`${sans.className} px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider
          border border-white/[0.07] text-white/40 hover:text-white/75 hover:border-white/20 transition-colors`}>
        Edit
      </button>
      {onToggle && (
        <button onClick={onToggle} disabled={isPending}
          className={`${sans.className} px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider
            border transition-colors disabled:opacity-40
            ${isPublished
              ? "border-amber-500/15 text-amber-400/50 hover:border-amber-500/35 hover:text-amber-400"
              : "border-emerald-500/15 text-emerald-400/50 hover:border-emerald-500/35 hover:text-emerald-400"}`}>
          {isPublished ? "Unpublish" : "Publish"}
        </button>
      )}
      <button onClick={onDelete} disabled={isPending}
        className={`${sans.className} p-1.5 rounded-lg border border-red-500/10 text-red-400/40
          hover:border-red-500/30 hover:text-red-400 transition-colors disabled:opacity-40`}>
        <svg viewBox="0 0 14 14" width="11" height="11" fill="none">
          <path d="M2 3.5h10M5 3.5V2.5h4v1M4 3.5l.7 8h4.6l.7-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

// ── Shared: section header ────────────────────────────────────────────────────
function TabHeader({ title, count, unit, onAdd, addLabel }) {
  return (
    <div className="flex items-center justify-between mb-7">
      <div>
        <p className={`${sans.className} text-[11.5px] font-medium text-white/55`}>
          {count} {unit}{count !== 1 ? "s" : ""}
        </p>
      </div>
      <button onClick={onAdd}
        className={`${sans.className} flex items-center gap-2 px-4 py-2.5 rounded-xl
          bg-[#7A2267] hover:bg-[#8e2578] text-white font-semibold
          text-[10px] uppercase tracking-[0.15em] transition-all duration-200
          shadow-[0_2px_12px_rgba(122,34,103,0.25)] hover:shadow-[0_4px_18px_rgba(122,34,103,0.35)]`}>
        <svg viewBox="0 0 12 12" width="9" height="9" fill="none">
          <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        {addLabel}
      </button>
    </div>
  );
}

// ── Shared: empty state ───────────────────────────────────────────────────────
function Empty({ icon, text, onAdd, addLabel }) {
  return (
    <div className="text-center py-20 px-6">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-5">
        {icon}
      </div>
      <p className={`${sans.className} text-[13px] text-white/25 mb-5`}>{text}</p>
      <button onClick={onAdd}
        className={`${sans.className} inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
          bg-[#7A2267]/15 border border-[#7A2267]/20 text-[#c084b8]
          text-[10px] uppercase tracking-wider font-medium hover:bg-[#7A2267]/25 transition-colors`}>
        <svg viewBox="0 0 12 12" width="9" height="9" fill="none">
          <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        {addLabel}
      </button>
    </div>
  );
}

// ── Shared: slide-in form panel ───────────────────────────────────────────────
function FormPanel({ title, children, onBack }) {
  return (
    <div className="mb-8">
      <button onClick={onBack}
        className={`${sans.className} inline-flex items-center gap-2 mb-5
          text-[9.5px] uppercase tracking-[0.2em] font-semibold text-white/30 hover:text-white/65 transition-colors`}>
        <svg viewBox="0 0 10 10" width="8" height="8" fill="none">
          <path d="M8 5H2M5 2L2 5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to list
      </button>
      <div className="bg-[#111] border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.05]">
          <h3 className={`${sans.className} text-[13px] font-semibold text-white/80`}>{title}</h3>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// EVENTS TAB
// ────────────────────────────────────────────────────────────────────
const BLANK_EVENT = { title: "", description: "", image: "", gallery: [], client: "", eventDate: "", tags: "", isPublished: true, sortOrder: 0 };

function EventForm({ initial = BLANK_EVENT, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    ...BLANK_EVENT, ...initial,
    tags:    Array.isArray(initial.tags)    ? initial.tags.join(", ")    : (initial.tags || ""),
    gallery: Array.isArray(initial.gallery) ? initial.gallery            : [],
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  function handleSubmit(e) {
    e.preventDefault();
    onSave({ ...form, tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [], sortOrder: Number(form.sortOrder) || 0 });
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="sm:col-span-2">
          <label className={LABEL}>Cover Image <span className="text-[#7A2267]">*</span></label>
          <ImageUpload value={form.image} onChange={(url) => setForm((f) => ({ ...f, image: url }))} dark />
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL}>
            Event Gallery
            <span className={`${sans.className} normal-case font-normal text-white/20 text-[9px] ml-2`}>optional — extra photos from the event</span>
          </label>
          <GalleryPicker images={form.gallery} onChange={(imgs) => setForm((f) => ({ ...f, gallery: imgs }))} />
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL}>Event Title <span className="text-[#7A2267]">*</span></label>
          <input className={INPUT} value={form.title} onChange={set("title")} placeholder="e.g. Annual Sales Conference 2024" required />
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL}>Description</label>
          <textarea rows={2} className={`${INPUT} resize-none`} value={form.description} onChange={set("description")} placeholder="Brief description..." />
        </div>
        <div>
          <label className={LABEL}>Client / Organisation</label>
          <input className={INPUT} value={form.client} onChange={set("client")} placeholder="Company name" />
        </div>
        <div>
          <label className={LABEL}>Event Date</label>
          <input className={INPUT} value={form.eventDate} onChange={set("eventDate")} placeholder="e.g. March 2025" />
        </div>
        <div>
          <label className={LABEL}>Tags <span className="text-white/15 normal-case font-normal text-[9px]">comma separated</span></label>
          <input className={INPUT} value={form.tags} onChange={set("tags")} placeholder="Conference, Launch" />
        </div>
        <div>
          <label className={LABEL}>Sort Order</label>
          <input type="number" className={INPUT} value={form.sortOrder} onChange={set("sortOrder")} min="0" />
        </div>
      </div>
      <Toggle value={form.isPublished} onChange={(v) => setForm((f) => ({ ...f, isPublished: v }))}
        label={form.isPublished ? "Published — visible on /corporate" : "Draft — hidden from public"} />
      <SaveBar saving={saving} label="Save Event" onCancel={onCancel} disabled={!form.title || !form.image} />
    </form>
  );
}

function EventCard({ event, onEdit, onDelete, onTogglePublish }) {
  const [, start] = useTransition();
  return (
    <div className="group relative bg-[#111] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/[0.12] transition-all duration-300">
      <div className="relative w-full overflow-hidden cursor-pointer" style={{ paddingBottom: "56.25%" }} onClick={() => onEdit(event)}>
        {event.image
          ? <img src={event.image} alt={event.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          : <div className="absolute inset-0 bg-white/[0.02] flex items-center justify-center">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="rgba(255,255,255,0.1)" strokeWidth="1.3" /><circle cx="8.5" cy="8.5" r="1.5" stroke="rgba(255,255,255,0.1)" strokeWidth="1.2" /></svg>
            </div>
        }
        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          <span className={`${sans.className} text-[8px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full
            ${event.isPublished ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/25" : "bg-white/8 text-white/35 border border-white/10"}`}>
            {event.isPublished ? "Live" : "Draft"}
          </span>
          {event.gallery?.length > 0 && (
            <span className={`${sans.className} text-[8px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[#7A2267]/20 text-[#c084b8]/80 border border-[#7A2267]/20`}>
              +{event.gallery.length} photos
            </span>
          )}
        </div>
        {/* Edit overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
          <span className={`${sans.className} text-[10px] uppercase tracking-wider text-white font-semibold
            opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/50 px-3 py-1.5 rounded-full`}>
            Edit
          </span>
        </div>
      </div>
      <div className="p-3.5">
        <p className={`${playfair.className} text-[13px] font-semibold text-white/85 line-clamp-1 mb-0.5`}>{event.title}</p>
        {event.client && <p className={`${sans.className} text-[10px] text-white/35`}>{event.client}</p>}
        <div className="flex items-center justify-between mt-3">
          <ItemActions
            onEdit={() => onEdit(event)}
            onDelete={() => { if (confirm("Delete this event?")) start(async () => { await onDelete(event._id); }); }}
            onToggle={() => start(async () => { await onTogglePublish(event); })}
            isPublished={event.isPublished}
          />
        </div>
      </div>
    </div>
  );
}

function EventsTab({ events: init }) {
  const [events, setEvents] = useState(init);
  const [mode, setMode]     = useState("list");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving]   = useState(false);

  async function handleSave(data) {
    setSaving(true);
    try {
      if (editing) {
        await updateCorporateEvent(editing._id, data);
        setEvents((ev) => ev.map((e) => e._id === editing._id ? { ...e, ...data } : e));
      } else {
        const res = await createCorporateEvent(data);
        if (res.success) setEvents((ev) => [{ ...data, _id: Date.now().toString(), createdAt: new Date().toISOString() }, ...ev]);
      }
      setMode("list"); setEditing(null);
    } finally { setSaving(false); }
  }

  async function handleToggle(event) {
    await updateCorporateEvent(event._id, { ...event, isPublished: !event.isPublished });
    setEvents((ev) => ev.map((e) => e._id === event._id ? { ...e, isPublished: !e.isPublished } : e));
  }

  if (mode !== "list") {
    return (
      <FormPanel title={mode === "create" ? "Add New Event" : "Edit Event"} onBack={() => { setMode("list"); setEditing(null); }}>
        <EventForm initial={editing || BLANK_EVENT} onSave={handleSave}
          onCancel={() => { setMode("list"); setEditing(null); }} saving={saving} />
      </FormPanel>
    );
  }

  return (
    <>
      <TabHeader title="Events" count={events.length} unit="event" onAdd={() => { setEditing(null); setMode("create"); }} addLabel="Add Event" />
      {events.length === 0
        ? <Empty icon={<svg viewBox="0 0 20 20" width="20" height="20" fill="none"><rect x="2" y="2" width="16" height="16" rx="2" stroke="rgba(255,255,255,0.18)" strokeWidth="1.3" /><circle cx="6.5" cy="7" r="1.3" stroke="rgba(255,255,255,0.15)" strokeWidth="1.1" /><path d="M2 14l4-3.5 3 2.5 3-2.5 5 3.5" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" strokeLinecap="round" /></svg>}
            text="No events yet." onAdd={() => { setEditing(null); setMode("create"); }} addLabel="Add First Event" />
        : <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {events.map((ev) => (
              <EventCard key={ev._id} event={ev}
                onEdit={(e) => { setEditing(e); setMode("edit"); }}
                onDelete={async (id) => { await deleteCorporateEvent(id); setEvents((ev) => ev.filter((e) => e._id !== id)); }}
                onTogglePublish={handleToggle} />
            ))}
          </div>
      }
    </>
  );
}

// ────────────────────────────────────────────────────────────────────
// VENUES TAB
// ────────────────────────────────────────────────────────────────────
const BLANK_VENUE = { name: "", slug: "", capacity: "", badge: "", description: "", features: "", image: "", gallery: [], isPublished: true, sortOrder: 0 };

function VenueForm({ initial = BLANK_VENUE, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    ...BLANK_VENUE, ...initial,
    features: Array.isArray(initial.features) ? initial.features.join(", ") : (initial.features || ""),
    gallery:  Array.isArray(initial.gallery)  ? initial.gallery              : [],
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      ...form,
      features:  form.features ? form.features.split(",").map((f) => f.trim()).filter(Boolean) : [],
      sortOrder: Number(form.sortOrder) || 0,
    });
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Cover image */}
      <div>
        <label className={LABEL}>Cover Image <span className="text-[#7A2267]">*</span></label>
        <ImageUpload value={form.image} onChange={(url) => setForm((f) => ({ ...f, image: url }))} dark />
      </div>

      {/* Gallery */}
      <div>
        <label className={LABEL}>
          Photo Gallery
          <span className={`${sans.className} normal-case font-normal text-white/20 text-[9px] ml-2`}>additional venue photos</span>
        </label>
        <GalleryPicker images={form.gallery} onChange={(imgs) => setForm((f) => ({ ...f, gallery: imgs }))} />
      </div>

      {/* Name + Capacity */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Venue Name <span className="text-[#7A2267]">*</span></label>
          <input className={INPUT} value={form.name} onChange={set("name")} placeholder="e.g. Grand Banquet Hall" required />
        </div>
        <div>
          <label className={LABEL}>Capacity <span className="text-[#7A2267]">*</span></label>
          <input className={INPUT} value={form.capacity} onChange={set("capacity")} placeholder="e.g. Up to 800" required />
        </div>
      </div>

      {/* Badge + Slug */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Badge <span className="text-white/20 normal-case font-normal text-[9px]">optional</span></label>
          <input className={INPUT} value={form.badge} onChange={set("badge")} placeholder="e.g. Most Popular" />
        </div>
        <div>
          <label className={LABEL}>URL Slug <span className="text-white/20 normal-case font-normal text-[9px]">auto-generated if blank</span></label>
          <input className={INPUT} value={form.slug} onChange={set("slug")} placeholder="grand-banquet-hall" />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={LABEL}>Description</label>
        <textarea rows={3} className={`${INPUT} resize-none`} value={form.description} onChange={set("description")} placeholder="Describe this venue in detail..." />
      </div>

      {/* Features */}
      <div>
        <label className={LABEL}>Features / Highlights <span className="text-white/15 normal-case font-normal text-[9px]">comma separated</span></label>
        <input className={INPUT} value={form.features} onChange={set("features")} placeholder="800 persons, Stage & podium, Grand décor, Full AV" />
      </div>

      {/* Sort order */}
      <div className="flex items-center gap-4">
        <div style={{ maxWidth: 120 }}>
          <label className={LABEL}>Sort Order</label>
          <input type="number" className={INPUT} value={form.sortOrder} onChange={set("sortOrder")} min="0" />
        </div>
        <div className="mt-5">
          <Toggle value={form.isPublished} onChange={(v) => setForm((f) => ({ ...f, isPublished: v }))}
            label={form.isPublished ? "Published" : "Draft — hidden"} />
        </div>
      </div>

      <SaveBar saving={saving} label="Save Venue" onCancel={onCancel} disabled={!form.name || !form.capacity} />
    </form>
  );
}

function VenueCard({ venue, onEdit, onDelete }) {
  const [, start] = useTransition();
  const hasImg = !!venue.image;
  return (
    <div className="group bg-[#111] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/[0.12] transition-all duration-300">
      {/* Image area */}
      <div className="relative w-full bg-[#0d0d0d] overflow-hidden cursor-pointer" style={{ paddingBottom: "56.25%" }} onClick={() => onEdit(venue)}>
        {hasImg
          ? <img src={venue.image} alt={venue.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          : <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
                <rect x="3" y="3" width="26" height="26" rx="3" stroke="rgba(122,34,103,0.25)" strokeWidth="1.5" />
                <path d="M3 21l7-6 6 5 5-4 8 7" stroke="rgba(122,34,103,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="10" cy="11" r="2" stroke="rgba(122,34,103,0.2)" strokeWidth="1.3" />
              </svg>
              <span className={`${sans.className} text-[9px] uppercase tracking-wider text-white/15`}>No image</span>
            </div>
        }
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors duration-300 flex items-center justify-center">
          <span className={`${sans.className} text-[10px] uppercase tracking-wider text-white font-semibold
            opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-3 py-1.5 rounded-full`}>Edit</span>
        </div>
        {/* Status + gallery badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          <span className={`${sans.className} text-[8px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full
            ${venue.isPublished ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/25" : "bg-white/8 text-white/35 border border-white/10"}`}>
            {venue.isPublished ? "Live" : "Draft"}
          </span>
          {venue.gallery?.length > 0 && (
            <span className={`${sans.className} text-[8px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[#7A2267]/20 text-[#c084b8]/80 border border-[#7A2267]/15`}>
              {venue.gallery.length} photos
            </span>
          )}
        </div>
        {venue.badge && (
          <div className="absolute top-2.5 right-2.5">
            <span className={`${sans.className} text-[8px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-black/50 text-white/70 backdrop-blur-sm`}>
              {venue.badge}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <p className={`${playfair.className} text-[13.5px] font-semibold text-white/85 line-clamp-1`}>{venue.name}</p>
        <p className={`${sans.className} text-[11px] text-[#7A2267]/70 mt-0.5`}>{venue.capacity}</p>
        {venue.description && (
          <p className={`${sans.className} text-[10.5px] text-white/30 leading-[1.6] line-clamp-2 mt-1.5`}>{venue.description}</p>
        )}
        {venue.slug && (
          <p className={`${sans.className} text-[9px] text-white/18 mt-1.5 font-mono`}>/corporate/venues/{venue.slug}</p>
        )}
        <div className="mt-3 pt-3 border-t border-white/[0.05]">
          <ItemActions
            onEdit={() => onEdit(venue)}
            onDelete={() => { if (confirm(`Delete "${venue.name}"? This cannot be undone.`)) start(async () => { await onDelete(venue._id); }); }}
          />
        </div>
      </div>
    </div>
  );
}

function VenuesTab({ venues: init }) {
  const [venues, setVenues] = useState(init);
  const [mode, setMode]     = useState("list");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [, start]             = useTransition();

  async function handleSave(data) {
    setSaving(true);
    try {
      if (editing) {
        await updateCorporateVenue(editing._id, data);
        setVenues((vs) => vs.map((v) => v._id === editing._id ? { ...v, ...data } : v));
      } else {
        const res = await createCorporateVenue(data);
        if (res.success) setVenues((vs) => [...vs, { ...data, _id: Date.now().toString(), createdAt: new Date().toISOString() }]);
      }
      setMode("list"); setEditing(null);
    } finally { setSaving(false); }
  }

  if (mode !== "list") {
    return (
      <FormPanel title={mode === "create" ? "Add New Venue" : `Edit: ${editing?.name || "Venue"}`} onBack={() => { setMode("list"); setEditing(null); }}>
        <VenueForm initial={editing || BLANK_VENUE} onSave={handleSave}
          onCancel={() => { setMode("list"); setEditing(null); }} saving={saving} />
      </FormPanel>
    );
  }

  return (
    <>
      <TabHeader title="Venues" count={venues.length} unit="venue" onAdd={() => { setEditing(null); setMode("create"); }} addLabel="Add Venue" />
      {venues.length === 0
        ? <Empty icon={<svg viewBox="0 0 20 20" width="20" height="20" fill="none"><path d="M2 18V9L10 3l8 6v9" stroke="rgba(255,255,255,0.18)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><rect x="7" y="11" width="6" height="7" rx="1" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" /></svg>}
            text="No venues yet. Add your event spaces." onAdd={() => { setEditing(null); setMode("create"); }} addLabel="Add First Venue" />
        : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {venues.map((v) => (
              <VenueCard key={v._id} venue={v}
                onEdit={(v) => { setEditing(v); setMode("edit"); }}
                onDelete={async (id) => { await deleteCorporateVenue(id); setVenues((vs) => vs.filter((v) => v._id !== id)); }} />
            ))}
          </div>
      }
    </>
  );
}

// ────────────────────────────────────────────────────────────────────
// BRANDS TAB
// ────────────────────────────────────────────────────────────────────
const BLANK_BRAND = { name: "", logo: "", industry: "", isPublished: true, sortOrder: 0 };

function BrandForm({ initial = BLANK_BRAND, onSave, onCancel, saving }) {
  const [form, setForm] = useState({ ...BLANK_BRAND, ...initial });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  function handleSubmit(e) { e.preventDefault(); onSave({ ...form, sortOrder: Number(form.sortOrder) || 0 }); }
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Brand Name <span className="text-[#7A2267]">*</span></label>
          <input className={INPUT} value={form.name} onChange={set("name")} placeholder="e.g. Grameen Bank" required />
        </div>
        <div>
          <label className={LABEL}>Industry</label>
          <input className={INPUT} value={form.industry} onChange={set("industry")} placeholder="e.g. Banking & Finance" />
        </div>
      </div>
      <div>
        <label className={LABEL}>
          Logo
          <span className={`${sans.className} normal-case font-normal text-white/20 text-[9px] ml-2`}>optional — shows initials if not set</span>
        </label>
        <ImageUpload value={form.logo} onChange={(url) => setForm((f) => ({ ...f, logo: url }))} dark />
      </div>
      <div className="flex items-center gap-4">
        <div style={{ maxWidth: 120 }}>
          <label className={LABEL}>Sort Order</label>
          <input type="number" className={INPUT} value={form.sortOrder} onChange={set("sortOrder")} min="0" />
        </div>
        <div className="mt-5">
          <Toggle value={form.isPublished} onChange={(v) => setForm((f) => ({ ...f, isPublished: v }))}
            label={form.isPublished ? "Published" : "Draft — hidden"} />
        </div>
      </div>
      <SaveBar saving={saving} label="Save Brand" onCancel={onCancel} disabled={!form.name} />
    </form>
  );
}

function BrandCard({ brand, onEdit, onDelete }) {
  const [, start] = useTransition();
  return (
    <div className="group bg-[#111] border border-white/[0.06] rounded-2xl p-4 flex flex-col items-center gap-3 text-center
      hover:border-[#7A2267]/25 transition-all duration-300">
      <div className="w-16 h-16 rounded-2xl bg-[#0d0d0d] border border-white/[0.07] overflow-hidden flex items-center justify-center">
        {brand.logo
          ? <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain p-1.5" />
          : <span className={`${playfair.className} text-[16px] font-semibold text-[#7A2267]/50`}>
              {brand.name.slice(0, 2).toUpperCase()}
            </span>
        }
      </div>
      <div className="flex-1">
        <p className={`${sans.className} text-[12px] font-semibold text-white/80`}>{brand.name}</p>
        {brand.industry && <p className={`${sans.className} text-[10px] text-white/30 mt-0.5 uppercase tracking-wide`}>{brand.industry}</p>}
        {!brand.isPublished && (
          <span className={`${sans.className} inline-block mt-1.5 text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-white/25 border border-white/8`}>Draft</span>
        )}
      </div>
      <div className="flex items-center gap-1.5 w-full justify-center pt-2 border-t border-white/[0.05]">
        <button onClick={() => onEdit(brand)}
          className={`${sans.className} flex-1 py-1.5 rounded-lg text-[9px] uppercase tracking-wider border border-white/[0.07] text-white/35 hover:text-white/65 hover:border-white/18 transition-colors`}>
          Edit
        </button>
        <button onClick={() => { if (confirm("Delete this brand?")) start(async () => { await onDelete(brand._id); }); }}
          className={`${sans.className} p-1.5 rounded-lg border border-red-500/10 text-red-400/35 hover:border-red-500/30 hover:text-red-400 transition-colors`}>
          <svg viewBox="0 0 14 14" width="10" height="10" fill="none">
            <path d="M2 3.5h10M5 3.5V2.5h4v1M4 3.5l.7 8h4.6l.7-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function BrandsTab({ brands: init }) {
  const [brands, setBrands] = useState(init);
  const [mode, setMode]     = useState("list");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving]   = useState(false);

  async function handleSave(data) {
    setSaving(true);
    try {
      if (editing) {
        await updateCorporateBrand(editing._id, data);
        setBrands((bs) => bs.map((b) => b._id === editing._id ? { ...b, ...data } : b));
      } else {
        const res = await createCorporateBrand(data);
        if (res.success) setBrands((bs) => [...bs, { ...data, _id: Date.now().toString(), createdAt: new Date().toISOString() }]);
      }
      setMode("list"); setEditing(null);
    } finally { setSaving(false); }
  }

  if (mode !== "list") {
    return (
      <FormPanel title={mode === "create" ? "Add New Brand" : "Edit Brand"} onBack={() => { setMode("list"); setEditing(null); }}>
        <BrandForm initial={editing || BLANK_BRAND} onSave={handleSave}
          onCancel={() => { setMode("list"); setEditing(null); }} saving={saving} />
      </FormPanel>
    );
  }

  return (
    <>
      <TabHeader title="Brands" count={brands.length} unit="brand" onAdd={() => { setEditing(null); setMode("create"); }} addLabel="Add Brand" />
      {brands.length === 0
        ? <Empty icon={<svg viewBox="0 0 20 20" width="20" height="20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="rgba(255,255,255,0.18)" strokeWidth="1.3" /><path d="M10 6v4l2.5 2.5" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" strokeLinecap="round" /></svg>}
            text="No brands yet. Add your trusted clients." onAdd={() => { setEditing(null); setMode("create"); }} addLabel="Add First Brand" />
        : <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {brands.map((b) => (
              <BrandCard key={b._id} brand={b}
                onEdit={(b) => { setEditing(b); setMode("edit"); }}
                onDelete={async (id) => { await deleteCorporateBrand(id); setBrands((bs) => bs.filter((b) => b._id !== id)); }} />
            ))}
          </div>
      }
    </>
  );
}

// ── Tab navigation ────────────────────────────────────────────────────────────
const TABS = [
  {
    id: "events", label: "Events Gallery",
    Icon: () => (
      <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
        <rect x="1" y="2.5" width="14" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="4.5" cy="6" r="1.2" stroke="currentColor" strokeWidth="1.1" />
        <path d="M1 11.5l3-2.5 2.5 2 2.5-2 4.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "venues", label: "Venues",
    Icon: () => (
      <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
        <path d="M1.5 15V8L8 2.5 14.5 8v7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="5.5" y="9" width="5" height="6" rx="0.8" stroke="currentColor" strokeWidth="1.2" />
        <path d="M8 9v6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      </svg>
    ),
  },
  {
    id: "brands", label: "Trusted Brands",
    Icon: () => (
      <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
        <circle cx="8" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.3" />
        <path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
];

// ── Root manager ──────────────────────────────────────────────────────────────
export default function CorporateManager({ initialEvents, initialVenues, initialBrands }) {
  const [tab, setTab] = useState("events");

  const counts = {
    events: initialEvents.length,
    venues: initialVenues.length,
    brands: initialBrands.length,
  };

  return (
    <div className={`${sans.className} min-h-screen`} style={{ background: "#0d0d0d" }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8">

        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[#7A2267]/15 border border-[#7A2267]/20 flex items-center justify-center">
              <svg viewBox="0 0 16 16" width="13" height="13" fill="none" className="text-[#7A2267]">
                <rect x="1" y="1" width="6.5" height="6.5" rx="1.3" stroke="currentColor" strokeWidth="1.3" />
                <rect x="8.5" y="1" width="6.5" height="6.5" rx="1.3" stroke="currentColor" strokeWidth="1.3" />
                <rect x="1" y="8.5" width="6.5" height="6.5" rx="1.3" stroke="currentColor" strokeWidth="1.3" />
                <rect x="8.5" y="8.5" width="6.5" height="6.5" rx="1.3" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            </div>
            <div>
              <h1 className={`${sans.className} text-[17px] font-bold text-white/90`}>Corporate Manager</h1>
              <p className={`${sans.className} text-[10.5px] text-white/30`}>Manage events, venues and trusted brands</p>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 mb-8 p-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl w-fit">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[11px] font-semibold transition-all duration-200
                ${tab === id
                  ? "bg-[#7A2267] text-white shadow-[0_2px_12px_rgba(122,34,103,0.4)]"
                  : "text-white/35 hover:text-white/65 hover:bg-white/[0.04]"
                } ${sans.className}`}>
              <Icon />
              {label}
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium
                ${tab === id ? "bg-white/20 text-white/80" : "bg-white/[0.06] text-white/25"}`}>
                {counts[id]}
              </span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-[#0f0f0f] border border-white/[0.06] rounded-2xl p-6 sm:p-8">
          {tab === "events" && <EventsTab events={initialEvents} />}
          {tab === "venues" && <VenuesTab venues={initialVenues} />}
          {tab === "brands" && <BrandsTab brands={initialBrands} />}
        </div>

      </div>
    </div>
  );
}
