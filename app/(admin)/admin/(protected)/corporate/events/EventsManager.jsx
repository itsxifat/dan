"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Montserrat, Playfair_Display } from "next/font/google";
import {
  createCorporateEvent,
  updateCorporateEvent,
  deleteCorporateEvent,
} from "@/actions/corporate/corporateActions";
import ImageUpload from "@/components/ui/ImageUpload";

const sans     = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600"] });

const LABEL = `${sans.className} block text-[9px] uppercase tracking-[0.18em] font-semibold text-white/35 mb-1.5`;
const INPUT = `w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3.5 py-2.5
  text-[12.5px] text-white/85 placeholder-white/20 outline-none
  focus:border-[#7A2267]/50 focus:bg-white/[0.07] transition-all duration-200`;

const BLANK = {
  title: "", description: "", image: "", client: "",
  eventDate: "", tags: "", isPublished: true, sortOrder: 0,
};

function EventForm({ initial = BLANK, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    ...BLANK, ...initial,
    tags: Array.isArray(initial.tags) ? initial.tags.join(", ") : initial.tags || "",
  });

  function set(k) {
    return (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      ...form,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      sortOrder: Number(form.sortOrder) || 0,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Image upload */}
      <div>
        <label className={LABEL}>Event Image <span className="text-[#7A2267]">*</span></label>
        <ImageUpload
          value={form.image}
          onChange={(url) => setForm((f) => ({ ...f, image: url }))}
          dark
        />
      </div>

      {/* Title */}
      <div>
        <label className={LABEL}>Event Title <span className="text-[#7A2267]">*</span></label>
        <input className={INPUT} value={form.title} onChange={set("title")}
          placeholder="e.g. Annual Sales Conference 2024" required />
      </div>

      {/* Description */}
      <div>
        <label className={LABEL}>Short Description</label>
        <textarea rows={2} className={`${INPUT} resize-none`} value={form.description}
          onChange={set("description")}
          placeholder="Brief description of the event..." />
      </div>

      {/* Client + Date */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Client / Organisation</label>
          <input className={INPUT} value={form.client} onChange={set("client")}
            placeholder="Company name" />
        </div>
        <div>
          <label className={LABEL}>Event Date</label>
          <input className={INPUT} value={form.eventDate} onChange={set("eventDate")}
            placeholder="e.g. March 2025 or 15 Jan 2025" />
        </div>
      </div>

      {/* Tags + Sort order */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Tags <span className="text-white/20 normal-case font-normal text-[9px]">(comma separated)</span></label>
          <input className={INPUT} value={form.tags} onChange={set("tags")}
            placeholder="Conference, Product Launch" />
        </div>
        <div>
          <label className={LABEL}>Sort Order</label>
          <input type="number" className={INPUT} value={form.sortOrder} onChange={set("sortOrder")}
            min="0" placeholder="0" />
        </div>
      </div>

      {/* Published toggle */}
      <div className="flex items-center gap-3 py-1">
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, isPublished: !f.isPublished }))}
          className={`relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0
            ${form.isPublished ? "bg-[#7A2267]" : "bg-white/[0.1]"}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200
            ${form.isPublished ? "left-[22px]" : "left-0.5"}`} />
        </button>
        <span className={`${sans.className} text-[11px] text-white/55`}>
          {form.isPublished ? "Published — visible on /corporate" : "Draft — hidden from public"}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        <button
          type="submit"
          disabled={saving || !form.title || !form.image}
          className={`${sans.className} flex items-center gap-2 px-5 py-2.5 rounded-xl
            bg-[#7A2267] hover:bg-[#8a256f] text-white
            text-[10px] uppercase tracking-[0.18em] font-semibold
            transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {saving ? "Saving…" : "Save Event"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={`${sans.className} px-4 py-2.5 rounded-xl
            border border-white/[0.08] text-white/40 hover:text-white/70
            text-[10px] uppercase tracking-[0.15em] transition-colors duration-200`}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function EventCard({ event, onEdit, onDelete, onTogglePublish }) {
  const [isPending, start] = useTransition();

  return (
    <div className="group relative rounded-2xl bg-white/[0.04] border border-white/[0.06]
      hover:border-white/[0.12] transition-all duration-300 overflow-hidden">

      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {event.image ? (
          <Image
            src={event.image}
            alt={event.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-white/[0.03] flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="rgba(255,255,255,0.15)" strokeWidth="1.3" />
              <circle cx="8.5" cy="8.5" r="1.5" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" />
              <path d="M3 16l5-4 4 3 3-2.5 6 5" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
        )}
        {/* Published badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className={`${sans.className} text-[8.5px] uppercase tracking-wider font-semibold
            px-2 py-0.5 rounded-full
            ${event.isPublished
              ? "bg-emerald-400/20 text-emerald-400 border border-emerald-400/30"
              : "bg-white/10 text-white/40 border border-white/10"
            }`}>
            {event.isPublished ? "Published" : "Draft"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className={`${playfair.className} text-[13.5px] font-semibold text-white/90 mb-0.5 line-clamp-1`}>
          {event.title}
        </h3>
        {event.client && (
          <p className={`${sans.className} text-[10.5px] text-white/40 mb-1`}>{event.client}</p>
        )}
        {event.description && (
          <p className={`${sans.className} text-[11px] text-white/35 leading-[1.6] line-clamp-2`}>
            {event.description}
          </p>
        )}
        {event.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {event.tags.map((t) => (
              <span key={t} className={`${sans.className} text-[9px] px-2 py-0.5 rounded-full
                bg-[#7A2267]/15 text-[#c084b8]/70`}>{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-3.5 flex items-center gap-2 border-t border-white/[0.04] pt-3">
        <button
          onClick={() => onEdit(event)}
          className={`${sans.className} flex-1 py-2 rounded-lg text-[9.5px] uppercase tracking-wider
            border border-white/[0.07] text-white/40 hover:text-white/70 hover:border-white/20
            transition-colors duration-150`}
        >
          Edit
        </button>
        <button
          onClick={() => start(async () => { await onTogglePublish(event); })}
          disabled={isPending}
          className={`${sans.className} flex-1 py-2 rounded-lg text-[9.5px] uppercase tracking-wider
            border transition-colors duration-150
            ${event.isPublished
              ? "border-amber-500/20 text-amber-400/60 hover:border-amber-500/40 hover:text-amber-400"
              : "border-emerald-500/20 text-emerald-400/60 hover:border-emerald-500/40 hover:text-emerald-400"
            }
            disabled:opacity-50`}
        >
          {event.isPublished ? "Unpublish" : "Publish"}
        </button>
        <button
          onClick={() => onDelete(event._id)}
          disabled={isPending}
          className={`${sans.className} py-2 px-3 rounded-lg text-[9.5px]
            border border-red-500/15 text-red-400/50 hover:border-red-500/35 hover:text-red-400
            transition-colors duration-150 disabled:opacity-50`}
        >
          <svg viewBox="0 0 14 14" width="11" height="11" fill="none">
            <path d="M2 3.5h10M5 3.5V2.5h4v1M4 3.5l.7 8h4.6l.7-8"
              stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function EventsManager({ initialData }) {
  const [events, setEvents]   = useState(initialData?.events || []);
  const [mode, setMode]       = useState("list"); // list | create | edit
  const [editing, setEditing] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [, start]             = useTransition();

  async function handleSave(data) {
    setSaving(true);
    try {
      if (editing) {
        await updateCorporateEvent(editing._id, data);
        setEvents((evs) => evs.map((e) => e._id === editing._id ? { ...e, ...data } : e));
      } else {
        const res = await createCorporateEvent(data);
        if (res.success) {
          // Reload by adding optimistic entry
          setEvents((evs) => [{ ...data, _id: Date.now().toString(), createdAt: new Date().toISOString() }, ...evs]);
        }
      }
      setMode("list");
      setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this corporate event? This cannot be undone.")) return;
    start(async () => {
      await deleteCorporateEvent(id);
      setEvents((evs) => evs.filter((e) => e._id !== id));
    });
  }

  async function handleTogglePublish(event) {
    const updated = { ...event, isPublished: !event.isPublished };
    await updateCorporateEvent(event._id, updated);
    setEvents((evs) => evs.map((e) => e._id === event._id ? { ...e, isPublished: !e.isPublished } : e));
  }

  function handleEdit(event) {
    setEditing(event);
    setMode("edit");
  }

  return (
    <div className={`${sans.className} p-5 sm:p-8 max-w-7xl`}>

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[18px] font-semibold text-white/90">
            {mode === "list" ? "Corporate Events Gallery" : mode === "create" ? "Add New Event" : "Edit Event"}
          </h1>
          {mode === "list" && (
            <p className="text-[11px] text-white/30 mt-0.5">{events.length} event{events.length !== 1 ? "s" : ""}</p>
          )}
        </div>

        {mode === "list" ? (
          <button
            onClick={() => { setEditing(null); setMode("create"); }}
            className={`${sans.className} flex items-center gap-2 px-4 py-2.5 rounded-xl
              bg-[#7A2267] hover:bg-[#8a256f] text-white
              text-[10px] uppercase tracking-[0.18em] font-semibold
              transition-colors duration-200`}
          >
            <svg viewBox="0 0 14 14" width="10" height="10" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Add Event
          </button>
        ) : (
          <button
            onClick={() => { setMode("list"); setEditing(null); }}
            className={`${sans.className} flex items-center gap-2 px-4 py-2.5 rounded-xl
              border border-white/[0.08] text-white/40 hover:text-white/70
              text-[10px] uppercase tracking-[0.15em] transition-colors duration-200`}
          >
            ← Back
          </button>
        )}
      </div>

      {/* Form panel */}
      {mode !== "list" && (
        <div className="max-w-2xl bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 mb-8">
          <EventForm
            initial={editing || BLANK}
            onSave={handleSave}
            onCancel={() => { setMode("list"); setEditing(null); }}
            saving={saving}
          />
        </div>
      )}

      {/* Events grid */}
      {mode === "list" && (
        <>
          {events.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.06]
                flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
                  <rect x="2" y="2" width="16" height="16" rx="2" stroke="rgba(255,255,255,0.2)" strokeWidth="1.3" />
                  <circle cx="6" cy="6" r="1.2" stroke="rgba(255,255,255,0.2)" strokeWidth="1.1" />
                  <path d="M2 13l4-3.5 3 2.5 2.5-2 5 4" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-[13px] text-white/30 mb-4">No corporate events yet.</p>
              <button
                onClick={() => setMode("create")}
                className={`${sans.className} px-5 py-2.5 rounded-xl bg-[#7A2267]/20 border border-[#7A2267]/30
                  text-[10px] uppercase tracking-wider text-[#c084b8] hover:bg-[#7A2267]/30 transition-colors`}
              >
                Add First Event
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {events.map((event) => (
                <EventCard
                  key={event._id}
                  event={event}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onTogglePublish={handleTogglePublish}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
