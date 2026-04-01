"use client";

import { useState, useTransition } from "react";
import {
  createDayLongPackage,
  updateDayLongPackage,
  deleteDayLongPackage,
} from "@/actions/accommodation/dayLongPackageActions";

const INPUT  = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-[12.5px] text-white placeholder-white/20 focus:outline-none focus:border-[#7A2267]/60 transition-all duration-200";
const LABEL  = "block text-[10px] uppercase tracking-wider text-white/35 font-semibold mb-1.5";
const SELECT = "w-full bg-[#1a1309] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-[12.5px] text-white focus:outline-none focus:border-[#7A2267]/60 transition-all duration-200";

const BLANK = {
  name: "", description: "", price: 0, image: "",
  type: "entry",
  discountType: "none", discountValue: 0,
  isActive: true, sortOrder: 0,
};

async function uploadImage(file) {
  const fd = new FormData();
  fd.append("file", file);
  const res  = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json();
  return data.url || "";
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className="relative shrink-0">
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className={`w-9 h-5 rounded-full transition-colors duration-200 ${checked ? "bg-[#7A2267]" : "bg-white/10"}`} />
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </div>
      <span className="text-[12px] text-white/60">{label}</span>
    </label>
  );
}

function ServiceForm({ pkg = null, onDone }) {
  const isEdit = !!pkg;
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name:          pkg?.name          ?? "",
    description:   pkg?.description   ?? "",
    price:         pkg?.price         ?? 0,
    image:         pkg?.image         ?? "",
    type:          pkg?.type          ?? "entry",
    discountType:  pkg?.discountType  ?? "none",
    discountValue: pkg?.discountValue ?? 0,
    isActive:      pkg?.isActive      ?? true,
    sortOrder:     pkg?.sortOrder     ?? 0,
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  async function handleImagePick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      if (url) set("image", url);
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required."); return; }
    if (Number(form.price) < 0) { setError("Price cannot be negative."); return; }
    setError("");
    startTransition(async () => {
      try {
        const data = {
          ...form,
          price:         Number(form.price),
          discountValue: Number(form.discountValue),
          sortOrder:     Number(form.sortOrder),
        };
        if (isEdit) await updateDayLongPackage(pkg._id, data);
        else        await createDayLongPackage(data);
        onDone();
      } catch (err) {
        setError(err.message || "Failed to save.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="text-[11.5px] text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>
      )}

      {/* Type toggle */}
      <div>
        <label className={LABEL}>Service Type *</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { v: "entry", label: "Entry Fee", desc: "Mandatory — guest must select one" },
            { v: "addon", label: "Add-on",    desc: "Optional — guest can add or skip" },
          ].map(({ v, label, desc }) => (
            <button key={v} type="button" onClick={() => set("type", v)}
              className={`text-left p-3 rounded-xl border-2 transition-all
                ${form.type === v
                  ? "border-[#7A2267] bg-[#7A2267]/10"
                  : "border-white/[0.08] hover:border-white/20"}`}>
              <p className={`text-[12px] font-semibold ${form.type === v ? "text-[#c05aae]" : "text-white/70"}`}>{label}</p>
              <p className="text-[10.5px] text-white/30 mt-0.5">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Name + Price + Sort */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={LABEL}>Name *</label>
          <input className={INPUT} value={form.name} required
            onChange={(e) => set("name", e.target.value)}
            placeholder={form.type === "entry" ? "e.g. Day Entry" : "e.g. Swimming Pool"} />
        </div>
        <div>
          <label className={LABEL}>Price (BDT) *</label>
          <input type="number" className={INPUT} value={form.price} min="0" required
            onChange={(e) => set("price", e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>Sort Order</label>
          <input type="number" className={INPUT} value={form.sortOrder} min="0"
            onChange={(e) => set("sortOrder", e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className={LABEL}>Description</label>
          <textarea className={`${INPUT} resize-none`} rows={2} value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Brief description shown to guests" />
        </div>
      </div>

      {/* Image upload */}
      <div>
        <label className={LABEL}>Service Image</label>
        {form.image ? (
          <div className="relative rounded-xl overflow-hidden border border-white/[0.08] h-36">
            <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
            <button type="button" onClick={() => set("image", "")}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white text-sm flex items-center justify-center hover:bg-red-500/80 transition-colors">
              ×
            </button>
          </div>
        ) : (
          <label className={`flex items-center gap-3 border-2 border-dashed border-white/[0.08] rounded-xl px-4 py-4 cursor-pointer
            hover:border-[#7A2267]/40 transition-all ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
            <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
                <path d="M10 3v9M6.5 6.5L10 3l3.5 3.5" stroke="#7A2267" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 14v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2" stroke="#7A2267" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className="text-[12px] text-white/50">{uploading ? "Uploading…" : "Click to upload image"}</p>
              <p className="text-[10.5px] text-white/25 mt-0.5">JPG, PNG, WEBP · max 10 MB</p>
            </div>
            <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleImagePick} />
          </label>
        )}
      </div>

      {/* Discount (add-ons only) */}
      {form.type === "addon" && (
        <div>
          <label className={LABEL}>Discount Rule <span className="text-white/20 normal-case tracking-normal font-normal">(optional — applied to total when this add-on is selected)</span></label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[9.5px] text-white/25 mb-1 block">Type</label>
              <select className={SELECT} value={form.discountType} onChange={(e) => set("discountType", e.target.value)}>
                <option value="none">No discount</option>
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed amount (৳)</option>
              </select>
            </div>
            {form.discountType !== "none" && (
              <div>
                <label className="text-[9.5px] text-white/25 mb-1 block">
                  {form.discountType === "percent" ? "Percent (%)" : "Amount (৳)"}
                </label>
                <input type="number" className={INPUT} min="0"
                  value={form.discountValue}
                  onChange={(e) => set("discountValue", e.target.value)} />
              </div>
            )}
            {form.discountType !== "none" && (
              <div className="flex items-end pb-0.5">
                <p className="text-[10.5px] text-[#c05aae]/70 bg-[#7A2267]/10 border border-[#7A2267]/20 px-2.5 py-2 rounded-lg leading-snug">
                  {form.discountType === "percent"
                    ? `${form.discountValue || 0}% off total`
                    : `৳${Number(form.discountValue || 0).toLocaleString()} off total`}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <Toggle checked={form.isActive} onChange={(v) => set("isActive", v)} label="Active — visible to guests" />

      <div className="flex items-center gap-3 pt-1">
        <button type="submit" disabled={isPending || uploading}
          className="px-5 py-2 rounded-xl bg-[#7A2267] text-white text-[12px] font-semibold hover:bg-[#8e2878] disabled:opacity-50 transition-colors">
          {isPending ? "Saving…" : isEdit ? "Update Service" : "Create Service"}
        </button>
        <button type="button" onClick={onDone} className="text-[12px] text-white/30 hover:text-white/60 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function DayLongPackagesManager({ packages: initial }) {
  const [services, setServices] = useState(initial);
  const [showForm,  setShowForm]  = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [isPending, startTransition] = useTransition();

  const entries = services.filter((s) => s.type === "entry");
  const addons  = services.filter((s) => s.type === "addon");

  function handleDone() {
    setShowForm(false);
    setEditing(null);
    window.location.reload();
  }

  function handleDelete(id) {
    if (!confirm("Delete this service?")) return;
    startTransition(async () => {
      try {
        await deleteDayLongPackage(id);
        setServices((prev) => prev.filter((p) => p._id !== id));
      } catch {}
    });
  }

  function ServiceRow({ svc }) {
    return (
      <div className="bg-white/2 border border-white/6 rounded-xl overflow-hidden flex items-stretch gap-0">
        {svc.image && (
          <div className="w-20 shrink-0">
            <img src={svc.image} alt={svc.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0 p-4 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[13px] font-semibold text-white/80">{svc.name}</p>
              <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full border font-semibold
                ${svc.type === "entry"
                  ? "text-amber-400 border-amber-400/30 bg-amber-400/10"
                  : "text-blue-400 border-blue-400/30 bg-blue-400/10"}`}>
                {svc.type === "entry" ? "Entry" : "Add-on"}
              </span>
              {!svc.isActive && (
                <span className="text-[9px] uppercase tracking-wider text-white/25 border border-white/10 px-1.5 py-0.5 rounded-full">Inactive</span>
              )}
              {svc.discountType !== "none" && svc.discountValue > 0 && (
                <span className="text-[9px] text-emerald-400 border border-emerald-400/25 bg-emerald-400/10 px-1.5 py-0.5 rounded-full">
                  {svc.discountType === "percent" ? `${svc.discountValue}% off` : `৳${svc.discountValue} off`}
                </span>
              )}
            </div>
            <p className="text-[12.5px] text-[#c05aae] font-semibold mt-0.5">৳{Number(svc.price).toLocaleString()}</p>
            {svc.description && <p className="text-[11px] text-white/30 mt-0.5 truncate">{svc.description}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => { setEditing(svc); setShowForm(false); }}
              className="text-[11px] text-white/30 hover:text-white/70 px-3 py-1.5 rounded-lg border border-white/[0.07] hover:border-white/20 transition-all">
              Edit
            </button>
            <button onClick={() => handleDelete(svc._id)} disabled={isPending}
              className="text-[11px] text-red-400/40 hover:text-red-400 transition-colors px-2 py-1.5">
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add button */}
      {!showForm && !editing && (
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7A2267] text-white text-[12.5px] font-semibold hover:bg-[#8e2878] transition-colors">
          <svg viewBox="0 0 12 12" width="12" height="12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Add Service
        </button>
      )}

      {/* Create / Edit form */}
      {(showForm || editing) && (
        <div className="bg-white/2 border border-white/6 rounded-2xl p-6">
          <h3 className="text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold mb-5">
            {editing ? "Edit Service" : "New Service"}
          </h3>
          <ServiceForm pkg={editing || null} onDone={handleDone} />
        </div>
      )}

      {/* Entry services */}
      {entries.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-amber-400/60 font-semibold mb-2">
            Entry Services <span className="text-white/20 normal-case tracking-normal font-normal">(guest picks one — required)</span>
          </p>
          <div className="space-y-2">{entries.map((s) => <ServiceRow key={s._id} svc={s} />)}</div>
        </div>
      )}

      {/* Add-on services */}
      {addons.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-blue-400/60 font-semibold mb-2">
            Add-on Services <span className="text-white/20 normal-case tracking-normal font-normal">(guest picks any — optional)</span>
          </p>
          <div className="space-y-2">{addons.map((s) => <ServiceRow key={s._id} svc={s} />)}</div>
        </div>
      )}

      {services.length === 0 && !showForm && !editing && (
        <div className="bg-white/2 border border-white/6 rounded-2xl p-10 text-center">
          <p className="text-[13px] text-white/30">No day-long services yet.</p>
          <p className="text-[11px] text-white/20 mt-1">Add an Entry service first, then add optional add-ons like Swimming Pool, Lunch, etc.</p>
        </div>
      )}
    </div>
  );
}
