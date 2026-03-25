"use client";

import { useState, useTransition } from "react";
import {
  createDayLongPackage,
  updateDayLongPackage,
  deleteDayLongPackage,
} from "@/actions/accommodation/dayLongPackageActions";

const INPUT = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-[12.5px] text-white placeholder-white/20 focus:outline-none focus:border-[#7A2267]/60 transition-all duration-200";
const LABEL = "block text-[10px] uppercase tracking-wider text-white/35 font-semibold mb-1.5";

const BLANK = { name: "", description: "", price: 0, includes: [], isActive: true, sortOrder: 0 };

function PackageForm({ pkg = null, onDone }) {
  const isEdit = !!pkg;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [includesInput, setIncludesInput] = useState("");

  const [form, setForm] = useState({
    name:        pkg?.name        ?? "",
    description: pkg?.description ?? "",
    price:       pkg?.price       ?? 0,
    includes:    pkg?.includes    ?? [],
    isActive:    pkg?.isActive    ?? true,
    sortOrder:   pkg?.sortOrder   ?? 0,
  });

  function addInclude() {
    const val = includesInput.trim();
    if (!val || form.includes.includes(val)) return;
    setForm((f) => ({ ...f, includes: [...f.includes, val] }));
    setIncludesInput("");
  }

  function removeInclude(i) {
    setForm((f) => ({ ...f, includes: f.includes.filter((_, j) => j !== i) }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        const data = { ...form, price: Number(form.price), sortOrder: Number(form.sortOrder) };
        if (isEdit) {
          await updateDayLongPackage(pkg._id, data);
        } else {
          await createDayLongPackage(data);
        }
        onDone();
      } catch (err) {
        setError(err.message || "Failed to save.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-[11.5px] text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={LABEL}>Package Name *</label>
          <input className={INPUT} value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Entry + Swimming" required />
        </div>
        <div>
          <label className={LABEL}>Price (BDT) *</label>
          <input type="number" className={INPUT} value={form.price} min="0"
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
        </div>
        <div>
          <label className={LABEL}>Sort Order</label>
          <input type="number" className={INPUT} value={form.sortOrder} min="0"
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} />
        </div>
        <div className="col-span-2">
          <label className={LABEL}>Description</label>
          <textarea className={`${INPUT} resize-none`} rows={2} value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="What does this package include?" />
        </div>

        {/* Includes list */}
        <div className="col-span-2">
          <label className={LABEL}>Includes (items)</label>
          <div className="flex gap-2">
            <input className={INPUT} value={includesInput}
              onChange={(e) => setIncludesInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addInclude(); }}}
              placeholder="e.g. Entry, Swimming Pool…" />
            <button type="button" onClick={addInclude}
              className="shrink-0 px-3 py-2 rounded-xl bg-[#7A2267]/20 text-[#c05aae] text-[11px] font-semibold hover:bg-[#7A2267]/30 transition-colors">
              Add
            </button>
          </div>
          {form.includes.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.includes.map((item, i) => (
                <span key={i} className="flex items-center gap-1.5 text-[11px] text-white/60 bg-white/[0.06] border border-white/[0.08] px-2.5 py-1 rounded-full">
                  {item}
                  <button type="button" onClick={() => removeInclude(i)} className="text-white/30 hover:text-red-400 transition-colors">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative shrink-0">
              <input type="checkbox" className="sr-only" checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
              <div className={`w-9 h-5 rounded-full transition-colors duration-200 ${form.isActive ? "bg-[#7A2267]" : "bg-white/10"}`} />
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${form.isActive ? "translate-x-4" : "translate-x-0"}`} />
            </div>
            <span className="text-[12px] text-white/60">Package is active and visible to guests</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button type="submit" disabled={isPending}
          className="px-5 py-2 rounded-xl bg-[#7A2267] text-white text-[12px] font-semibold hover:bg-[#8e2878] disabled:opacity-50 transition-colors">
          {isPending ? "Saving…" : isEdit ? "Update Package" : "Create Package"}
        </button>
        <button type="button" onClick={onDone}
          className="text-[12px] text-white/30 hover:text-white/60 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function DayLongPackagesManager({ packages: initialPackages }) {
  const [packages, setPackages] = useState(initialPackages);
  const [showForm, setShowForm] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [isPending, startTransition] = useTransition();

  function handleDone() {
    setShowForm(false);
    setEditingPkg(null);
    // Refresh by re-fetching (Next.js revalidation)
    window.location.reload();
  }

  function handleDelete(id) {
    if (!confirm("Delete this package?")) return;
    startTransition(async () => {
      try {
        await deleteDayLongPackage(id);
        setPackages((prev) => prev.filter((p) => p._id !== id));
      } catch {}
    });
  }

  return (
    <div className="space-y-6">
      {/* Add button */}
      {!showForm && !editingPkg && (
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7A2267] text-white text-[12.5px] font-semibold hover:bg-[#8e2878] transition-colors">
          <svg viewBox="0 0 12 12" width="12" height="12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Add Package
        </button>
      )}

      {/* Create form */}
      {showForm && (
        <div className="bg-white/2 border border-white/6 rounded-2xl p-6">
          <h3 className="text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold mb-4">New Package</h3>
          <PackageForm onDone={handleDone} />
        </div>
      )}

      {/* Edit form */}
      {editingPkg && (
        <div className="bg-white/2 border border-white/6 rounded-2xl p-6">
          <h3 className="text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold mb-4">Edit Package</h3>
          <PackageForm pkg={editingPkg} onDone={handleDone} />
        </div>
      )}

      {/* Package list */}
      {packages.length === 0 ? (
        <div className="bg-white/2 border border-white/6 rounded-2xl p-10 text-center">
          <p className="text-[13px] text-white/30">No day-long packages yet.</p>
          <p className="text-[11px] text-white/20 mt-1">Create packages like "Entry Only" or "Entry + Swimming".</p>
        </div>
      ) : (
        <div className="space-y-3">
          {packages.map((pkg) => (
            <div key={pkg._id} className="bg-white/2 border border-white/6 rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-semibold text-white/80">{pkg.name}</p>
                  {!pkg.isActive && (
                    <span className="text-[9px] uppercase tracking-wider text-white/30 border border-white/10 px-1.5 py-0.5 rounded-full">Inactive</span>
                  )}
                </div>
                <p className="text-[12px] text-[#c05aae] font-semibold mt-0.5">৳{Number(pkg.price).toLocaleString()}</p>
                {pkg.includes?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {pkg.includes.map((item, i) => (
                      <span key={i} className="text-[10px] text-white/40 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-full">{item}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => { setEditingPkg(pkg); setShowForm(false); }}
                  className="text-[11px] text-white/30 hover:text-white/70 px-3 py-1.5 rounded-lg border border-white/[0.07] hover:border-white/20 transition-all">
                  Edit
                </button>
                <button onClick={() => handleDelete(pkg._id)} disabled={isPending}
                  className="text-[11px] text-red-400/40 hover:text-red-400 transition-colors px-2 py-1.5">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
