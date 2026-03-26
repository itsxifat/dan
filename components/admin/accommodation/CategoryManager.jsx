"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/actions/accommodation/categoryActions";
import ImageUpload from "@/components/ui/ImageUpload";

// ─── Constants ────────────────────────────────────────────────────────────────

const BED_TYPES = ["Single", "Double", "Twin", "King", "Queen", "Bunk", "Sofa Bed"];
const VARIANT_BED_TYPES = ["Single", "Double", "Twin", "King", "Queen", "Bunk", "Sofa Bed", "Triple"];

const BLANK_VARIANT = {
  name: "", bedType: "Double",
  pricePerNight: 0, supportsDayLong: false, pricePerDay: 0,
  maxAdults: 2, maxChildren: 0, description: "",
};

const INPUT = "w-full bg-white/4 border border-white/8 rounded-xl px-3.5 py-2.5 text-[12.5px] text-white placeholder-white/20 focus:outline-none focus:border-[#7A2267]/60 transition-all duration-200";
const LABEL = "block text-[10px] uppercase tracking-wider text-white/35 font-semibold mb-1.5";

// ─── ChevronIcon ──────────────────────────────────────────────────────────────

function ChevronIcon({ open }) {
  return (
    <svg viewBox="0 0 10 6" width="9" height="9" fill="none"
      className={`text-white/30 transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`}>
      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── CustomSelect ─────────────────────────────────────────────────────────────

function CustomSelect({ value, onChange, options, placeholder = "Select…", disabled = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = options.find((o) => String(o.value) === String(value));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 bg-white/4 border border-white/8
          rounded-xl px-3.5 py-2.5 text-[12.5px] text-left hover:border-white/15
          focus:outline-none focus:border-[#7A2267]/60 transition-all duration-200 disabled:opacity-50"
      >
        <span className={selected ? "text-white" : "text-white/25"}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronIcon open={open} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scaleY: 0.96 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -4, scaleY: 0.96 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            style={{ transformOrigin: "top" }}
            className="absolute left-0 right-0 top-full mt-1.5 z-[200]
              bg-[#161616] border border-white/10 rounded-xl overflow-auto max-h-52
              shadow-2xl shadow-black/60"
          >
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={`w-full px-3.5 py-2.5 text-left text-[12.5px] transition-colors
                  hover:bg-white/5 flex items-center justify-between gap-2
                  ${String(value) === String(o.value)
                    ? "text-white bg-[#7A2267]/15"
                    : "text-white/65"
                  }`}
              >
                <span>{o.label}</span>
                {String(value) === String(o.value) && (
                  <svg viewBox="0 0 12 12" width="11" height="11" fill="none" className="text-[#c05aae] shrink-0">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── MiniToggle ───────────────────────────────────────────────────────────────

function MiniToggle({ checked, onChange, label, sub }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div className="relative shrink-0">
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className={`w-9 h-5 rounded-full transition-colors duration-200 ${checked ? "bg-[#7A2267]" : "bg-white/10"}`} />
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </div>
      <div>
        <p className="text-[12px] font-semibold text-white/70">{label}</p>
        {sub && <p className="text-[9.5px] text-white/30 mt-0.5">{sub}</p>}
      </div>
    </label>
  );
}

// ─── VariantRow ───────────────────────────────────────────────────────────────

function VariantRow({ v, propertySupportsDayLong, onEdit, onRemove }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/2 transition-colors">
      <div className="flex-1 min-w-0 flex flex-wrap gap-x-3 gap-y-0.5 items-center">
        <span className="text-[12.5px] text-white/75 font-semibold">{v.name}</span>
        <span className="text-[11px] text-white/30">{v.bedType}</span>
        <span className="text-[11px] text-white/30">৳{Number(v.pricePerNight).toLocaleString()}/night</span>
        {propertySupportsDayLong && v.supportsDayLong && (
          <>
            <span className="text-[9px] uppercase tracking-wider bg-[#7A2267]/15 text-[#c05aae]
              border border-[#7A2267]/25 px-1.5 py-0.5 rounded-full">
              Day Long ✓
            </span>
            {v.pricePerDay > 0 && (
              <span className="text-[11px] text-[#c05aae]/60">৳{Number(v.pricePerDay).toLocaleString()}/day</span>
            )}
          </>
        )}
        <span className="text-[11px] text-white/20">{v.maxAdults}A · {v.maxChildren}C</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onEdit}
          className="px-2.5 py-1.5 rounded-lg text-[10.5px] text-white/30 hover:text-white/65
            hover:bg-white/5 border border-transparent hover:border-white/8 transition-all duration-200"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="px-2.5 py-1.5 rounded-lg text-[10.5px] text-red-400/40 hover:text-red-400
            hover:bg-red-500/8 border border-transparent hover:border-red-500/20 transition-all duration-200"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// ─── VariantForm ──────────────────────────────────────────────────────────────

function VariantForm({ initial, propertySupportsDayLong, onSave, onCancel, saveLabel = "Add" }) {
  const [vf, setVf] = useState({ ...BLANK_VARIANT, ...initial });
  const set = (k) => (val) => setVf((f) => ({ ...f, [k]: val }));

  const bedTypeOptions = VARIANT_BED_TYPES.map((b) => ({ value: b, label: b }));

  return (
    <div className="space-y-3">
      {propertySupportsDayLong && (
        <div className="bg-[#7A2267]/8 border border-[#7A2267]/20 rounded-xl p-3">
          <MiniToggle
            checked={vf.supportsDayLong}
            onChange={(v) => setVf((f) => ({ ...f, supportsDayLong: v, pricePerDay: v ? f.pricePerDay : 0 }))}
            label="Day Long Supported"
            sub="This variant can be booked for a full-day stay."
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Variant Name *</label>
          <input
            className={INPUT}
            value={vf.name}
            onChange={(e) => set("name")(e.target.value)}
            placeholder="e.g. Twin Sharing"
          />
        </div>
        <div>
          <label className={LABEL}>Bed Type</label>
          <CustomSelect
            value={vf.bedType}
            onChange={set("bedType")}
            options={bedTypeOptions}
          />
        </div>

        <div>
          <label className={LABEL}>Price / Night (BDT) *</label>
          <input
            type="number"
            className={INPUT}
            value={vf.pricePerNight}
            onChange={(e) => set("pricePerNight")(e.target.value)}
            min="0"
          />
        </div>
        {propertySupportsDayLong && vf.supportsDayLong && (
          <div>
            <label className={LABEL}>Price / Day (BDT)</label>
            <input
              type="number"
              className={INPUT}
              value={vf.pricePerDay ?? 0}
              onChange={(e) => set("pricePerDay")(e.target.value)}
              min="0"
            />
          </div>
        )}

        <div>
          <label className={LABEL}>Max Adults</label>
          <input type="number" className={INPUT} value={vf.maxAdults} onChange={(e) => set("maxAdults")(e.target.value)} min="1" />
        </div>
        <div>
          <label className={LABEL}>Max Children</label>
          <input type="number" className={INPUT} value={vf.maxChildren} onChange={(e) => set("maxChildren")(e.target.value)} min="0" />
        </div>
        <div className="col-span-2">
          <label className={LABEL}>Description</label>
          <input className={INPUT} value={vf.description} onChange={(e) => set("description")(e.target.value)} placeholder="Optional" />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { if (!vf.name.trim()) return; onSave(vf); }}
          className="px-4 py-1.5 rounded-lg bg-[#7A2267] text-white text-[11px] font-semibold
            hover:bg-[#8e2878] transition-colors"
        >
          {saveLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-[11px] text-white/30 hover:text-white/60 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── CategoryForm ─────────────────────────────────────────────────────────────

function CategoryForm({ propertyId, forBlock, propertySupportsDayLong, category = null, onDone }) {
  const isEdit = !!category;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [variants, setVariants] = useState(category?.variants ?? []);
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [editingVariantIdx, setEditingVariantIdx] = useState(null);

  const [form, setForm] = useState({
    name:          category?.name          ?? "",
    description:   category?.description   ?? "",
    coverImage:    category?.coverImage    ?? "",
    pricePerNight: category?.pricePerNight ?? 0,
    maxAdults:     category?.maxAdults     ?? 2,
    maxChildren:   category?.maxChildren   ?? 2,
    bedType:       category?.bedType       ?? "Double",
    size:          category?.size          ?? "",
    floorRange:    category?.floorRange    ?? "",
    block:         category?.block         ?? forBlock ?? "",
    isActive:      category?.isActive      ?? true,
    sortOrder:     category?.sortOrder     ?? 0,
  });

  const set    = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setNum = (k) => (e) => setForm((f) => ({ ...f, [k]: Number(e.target.value) }));
  const setVal = (k) => (val) => setForm((f) => ({ ...f, [k]: val }));

  const bedTypeOptions = BED_TYPES.map((b) => ({ value: b, label: b }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        const mappedVariants = variants.map((v) => ({
          ...v,
          pricePerNight:   Number(v.pricePerNight),
          supportsDayLong: Boolean(v.supportsDayLong),
          pricePerDay:     Number(v.pricePerDay ?? 0),
          maxAdults:       Number(v.maxAdults),
          maxChildren:     Number(v.maxChildren),
        }));

        // Derive day long support from variants automatically
        const derivedSupportsDayLong = mappedVariants.some((v) => v.supportsDayLong);
        const dayLongVariants = mappedVariants.filter((v) => v.supportsDayLong && v.pricePerDay > 0);
        const derivedPricePerDay = dayLongVariants.length > 0
          ? Math.min(...dayLongVariants.map((v) => v.pricePerDay))
          : 0;

        const data = {
          ...form,
          pricePerNight:   Number(form.pricePerNight),
          maxAdults:       Number(form.maxAdults),
          maxChildren:     Number(form.maxChildren),
          sortOrder:       Number(form.sortOrder),
          block:           form.block || "",
          supportsDayLong: derivedSupportsDayLong,
          pricePerDay:     derivedPricePerDay,
          variants:        mappedVariants,
        };
        isEdit ? await updateCategory(category._id, data) : await createCategory(propertyId, data);
        onDone();
      } catch (err) {
        setError(err.message || "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 mt-3">
      {error && (
        <p className="text-[11.5px] text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">
          {error}
        </p>
      )}

      {/* Day Long info — derived from variants */}
      {propertySupportsDayLong && (() => {
        const dayLongVars = variants.filter((v) => v.supportsDayLong);
        const prices = dayLongVars.filter((v) => Number(v.pricePerDay) > 0).map((v) => Number(v.pricePerDay));
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
        if (dayLongVars.length === 0) {
          return (
            <div className="flex items-center gap-2.5 bg-white/3 border border-white/8 rounded-xl px-4 py-3">
              <svg viewBox="0 0 14 14" width="13" height="13" fill="none" className="text-white/20 shrink-0">
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M7 6v4M7 4.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <p className="text-[11.5px] text-white/30">
                No day long support — enable it on one or more variants below.
              </p>
            </div>
          );
        }
        return (
          <div className="flex items-start gap-2.5 bg-[#7A2267]/8 border border-[#7A2267]/20 rounded-xl px-4 py-3">
            <svg viewBox="0 0 14 14" width="13" height="13" fill="none" className="text-[#c05aae]/60 shrink-0 mt-0.5">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M7 6v4M7 4.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <div>
              <p className="text-[11.5px] text-[#c05aae]/80 font-semibold">Day Long Supported</p>
              <p className="text-[10.5px] text-[#c05aae]/50 mt-0.5">
                {dayLongVars.length} variant{dayLongVars.length !== 1 ? "s" : ""} support day long
                {" "}({dayLongVars.map((v) => v.name).join(", ")}).
                {prices.length > 0 && (
                  <> Price range: ৳{minPrice.toLocaleString()}{minPrice !== maxPrice ? `–৳${maxPrice.toLocaleString()}` : ""}/day.</>
                )}
              </p>
            </div>
          </div>
        );
      })()}

      {/* Core fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={LABEL}>Category Name *</label>
          <input className={INPUT} value={form.name} onChange={set("name")} placeholder="e.g. Deluxe Double" required />
        </div>

        <div>
          <label className={LABEL}>Price / Night (BDT) *</label>
          <input type="number" className={INPUT} value={form.pricePerNight} onChange={setNum("pricePerNight")} min="0" required />
        </div>

        <div>
          <label className={LABEL}>Bed Type</label>
          <CustomSelect
            value={form.bedType}
            onChange={setVal("bedType")}
            options={bedTypeOptions}
          />
        </div>

        <div>
          <label className={LABEL}>Max Adults</label>
          <input type="number" className={INPUT} value={form.maxAdults} onChange={setNum("maxAdults")} min="1" />
        </div>
        <div>
          <label className={LABEL}>Max Children</label>
          <input type="number" className={INPUT} value={form.maxChildren} onChange={setNum("maxChildren")} min="0" />
        </div>
        <div>
          <label className={LABEL}>Room Size</label>
          <input className={INPUT} value={form.size} onChange={set("size")} placeholder="e.g. 35 sqm" />
        </div>
        <div>
          <label className={LABEL}>Floor Range</label>
          <input className={INPUT} value={form.floorRange} onChange={set("floorRange")} placeholder="e.g. 3–7" />
        </div>
        <div>
          <label className={LABEL}>Sort Order</label>
          <input type="number" className={INPUT} value={form.sortOrder} onChange={setNum("sortOrder")} min="0" />
        </div>

        <div className="col-span-2">
          <label className={LABEL}>Cover Image</label>
          <ImageUpload dark value={form.coverImage} onChange={(url) => setForm((f) => ({ ...f, coverImage: url }))} />
        </div>
        <div className="col-span-2">
          <label className={LABEL}>Description</label>
          <textarea
            className={`${INPUT} resize-none`}
            rows={3}
            value={form.description}
            onChange={set("description")}
            placeholder="Describe this category…"
          />
        </div>
      </div>

      {/* Variants */}
      <div className="border border-white/8 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/6 bg-white/2">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/35 font-semibold">Room Variants</p>
            <p className="text-[9.5px] text-white/20 mt-0.5">
              Different bed / price configurations within this category.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setEditingVariantIdx(null); setShowAddVariant((v) => !v); }}
            className="text-[11px] font-semibold text-[#c05aae]/60 hover:text-[#c05aae] transition-colors"
          >
            {showAddVariant ? "× Cancel" : "+ Add Variant"}
          </button>
        </div>

        {variants.length > 0 && (
          <div className="divide-y divide-white/4">
            {variants.map((v, i) => (
              <div key={i}>
                {editingVariantIdx === i ? (
                  <div className="px-4 py-3 bg-white/[0.015]">
                    <VariantForm
                      initial={v}
                      propertySupportsDayLong={propertySupportsDayLong}
                      saveLabel="Save"
                      onSave={(updated) => {
                        setVariants((p) => p.map((x, j) => j === i ? { ...x, ...updated } : x));
                        setEditingVariantIdx(null);
                      }}
                      onCancel={() => setEditingVariantIdx(null)}
                    />
                  </div>
                ) : (
                  <VariantRow
                    v={v}
                    propertySupportsDayLong={propertySupportsDayLong}
                    onEdit={() => { setShowAddVariant(false); setEditingVariantIdx(i); }}
                    onRemove={() => setVariants((p) => p.filter((_, j) => j !== i))}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {showAddVariant && (
          <div className="px-4 py-3 border-t border-white/6 bg-white/[0.015]">
            <VariantForm
              initial={BLANK_VARIANT}
              propertySupportsDayLong={propertySupportsDayLong}
              onSave={(v) => { setVariants((p) => [...p, v]); setShowAddVariant(false); }}
              onCancel={() => setShowAddVariant(false)}
            />
          </div>
        )}

        {variants.length === 0 && !showAddVariant && (
          <p className="px-4 py-3 text-[11px] text-white/20">
            No variants — add variants for different bed types or price tiers.
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2 rounded-xl bg-[#7A2267] text-white text-[12px] font-semibold
            hover:bg-[#8e2878] disabled:opacity-50 transition-colors duration-200"
        >
          {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Category"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="px-4 py-2 text-[12px] text-white/30 hover:text-white/60 transition-colors duration-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── CategoryRow ──────────────────────────────────────────────────────────────

function CategoryRow({ cat, propertyId, propertySupportsDayLong, blocks, editingId, setEditingId, onDelete, deletingId }) {
  if (editingId === cat._id) {
    return (
      <div className="bg-white/2 border border-[#7A2267]/20 rounded-xl p-4">
        <p className="text-[10px] uppercase tracking-wider text-[#c05aae]/60 font-semibold mb-2">
          Editing: {cat.name}
        </p>
        <CategoryForm
          propertyId={propertyId}
          forBlock={cat.block ?? ""}
          propertySupportsDayLong={propertySupportsDayLong}
          category={cat}
          onDone={() => { setEditingId(null); window.location.reload(); }}
        />
      </div>
    );
  }

  return (
    <div className="bg-white/2 border border-white/6 rounded-xl px-4 py-3.5
      flex items-start justify-between gap-3 hover:border-white/10 transition-colors duration-200">
      <div className="flex-1 min-w-0">
        {/* Name row */}
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-[13.5px] font-semibold text-white/80">{cat.name}</span>
          {cat.coverImage && (
            <img src={cat.coverImage} alt="" className="w-5 h-5 rounded-md object-cover opacity-60 shrink-0"/>
          )}
          {cat.supportsDayLong && (
            <span className="text-[9px] uppercase tracking-wider bg-[#7A2267]/15 text-[#c05aae]
              border border-[#7A2267]/25 px-2 py-0.5 rounded-full">
              Day Long ✓
            </span>
          )}
          {!cat.isActive && (
            <span className="text-[9px] uppercase tracking-wider bg-white/5 text-white/30
              border border-white/10 px-2 py-0.5 rounded-full">
              Inactive
            </span>
          )}
        </div>

        {/* Stats row */}
        <div className="flex gap-3 flex-wrap">
          <span className="text-[11px] text-white/35">
            ৳{cat.pricePerNight?.toLocaleString()}/night
          </span>
          {cat.supportsDayLong && cat.pricePerDay > 0 && (
            <span className="text-[11px] text-[#c05aae]/60">
              ৳{cat.pricePerDay?.toLocaleString()}/day
            </span>
          )}
          <span className="text-[11px] text-white/25">{cat.bedType} · {cat.maxAdults} adults</span>
          {cat.variants?.length > 0 && (
            <span className="text-[11px] text-white/20">
              {cat.variants.length} variant{cat.variants.length !== 1 ? "s" : ""}
            </span>
          )}
          {cat.roomStats && (
            <span className="text-[11px] text-white/20">
              {cat.roomStats.available}/{cat.roomStats.total} rooms
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => setEditingId(cat._id)}
          className="px-3 py-1.5 rounded-lg text-[11px] text-white/30 hover:text-white/65
            hover:bg-white/5 border border-transparent hover:border-white/8 transition-all duration-200"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(cat._id)}
          disabled={deletingId === cat._id}
          className="px-3 py-1.5 rounded-lg text-[11px] text-red-400/40 hover:text-red-400
            hover:bg-red-500/8 border border-transparent hover:border-red-500/20
            transition-all duration-200 disabled:opacity-40"
        >
          {deletingId === cat._id ? "…" : "Delete"}
        </button>
      </div>
    </div>
  );
}

// ─── BlockSection ─────────────────────────────────────────────────────────────

function BlockSection({ blockKey, label, cats, propertyId, propertySupportsDayLong, blocks, editingId, setEditingId, onDelete, deletingId }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="border border-white/7 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-white/2 border-b border-white/6">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 14 14" width="11" height="11" fill="none" className="text-[#7A2267]/50 shrink-0">
            <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M4 7h6M4 4.5h6M4 9.5h3.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
          </svg>
          <span className="text-[11px] font-bold text-white/45 uppercase tracking-[0.18em]">{label}</span>
          {cats.length > 0 && (
            <span className="text-[9.5px] text-white/20">
              ({cats.length} {cats.length === 1 ? "category" : "categories"})
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-[11px] font-semibold text-[#c05aae]/60 hover:text-[#c05aae]
            transition-colors flex items-center gap-1"
        >
          {showForm ? "× Cancel" : `+ Add Category${blockKey ? ` — ${blockKey}` : ""}`}
        </button>
      </div>

      <div className="p-4 space-y-3">
        {showForm && (
          <div className="bg-[#7A2267]/5 border border-[#7A2267]/20 rounded-xl p-4 mb-1">
            <CategoryForm
              propertyId={propertyId}
              forBlock={blockKey}
              propertySupportsDayLong={propertySupportsDayLong}
              onDone={() => { setShowForm(false); window.location.reload(); }}
            />
          </div>
        )}

        {cats.length === 0 && !showForm && (
          <p className="text-[11.5px] text-white/20 text-center py-5">
            No categories yet{blockKey ? ` for ${blockKey}` : ""}. Click "+ Add Category" above.
          </p>
        )}

        {cats.map((cat) => (
          <CategoryRow
            key={cat._id}
            cat={cat}
            propertyId={propertyId}
            propertySupportsDayLong={propertySupportsDayLong}
            blocks={blocks}
            editingId={editingId}
            setEditingId={setEditingId}
            onDelete={onDelete}
            deletingId={deletingId}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function CategoryManager({ propertyId, blocks = [], propertySupportsDayLong = false, initialCategories = [] }) {
  const [categories,  setCategories]  = useState(initialCategories);
  const [editingId,   setEditingId]   = useState(null);
  const [deletingId,  setDeletingId]  = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [isPending,   startTransition] = useTransition();

  function handleDelete(catId) {
    setDeleteError("");
    setDeletingId(catId);
    startTransition(async () => {
      try {
        await deleteCategory(catId);
        setCategories((prev) => prev.filter((c) => c._id !== catId));
      } catch (err) {
        setDeleteError(err.message || "Delete failed.");
      } finally {
        setDeletingId(null);
      }
    });
  }

  const hasBlocks   = blocks.length > 0;
  const sharedProps = { propertyId, propertySupportsDayLong, blocks, editingId, setEditingId, onDelete: handleDelete, deletingId };

  if (!hasBlocks) {
    return (
      <div className="space-y-3">
        {deleteError && (
          <p className="text-[11.5px] text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">
            {deleteError}
          </p>
        )}
        <BlockSection blockKey="" label="Categories" cats={categories} {...sharedProps} />
      </div>
    );
  }

  const blockSections = [
    ...blocks.map((b) => ({ key: b, label: b, cats: categories.filter((c) => c.block === b) })),
    { key: "", label: "Property-wide (all blocks)", cats: categories.filter((c) => !c.block || c.block === "") },
  ];

  return (
    <div className="space-y-4">
      {deleteError && (
        <p className="text-[11.5px] text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">
          {deleteError}
        </p>
      )}

      <div className="flex items-start gap-2.5 bg-blue-500/8 border border-blue-500/15 rounded-xl px-4 py-3">
        <svg viewBox="0 0 14 14" width="13" height="13" className="text-blue-400/70 shrink-0 mt-0.5" fill="none">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M7 6v4M7 4.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        <p className="text-[11.5px] text-blue-300/60 leading-relaxed">
          This property has{" "}
          <strong className="text-blue-300/80">{blocks.length} block{blocks.length !== 1 ? "s" : ""}</strong>
          {" "}({blocks.join(", ")}). Each block can have its own categories, or create a{" "}
          <em>property-wide</em> category that applies to all blocks.
        </p>
      </div>

      {blockSections.map((section) => (
        <BlockSection
          key={section.key || "_all"}
          blockKey={section.key}
          label={section.label}
          cats={section.cats}
          {...sharedProps}
        />
      ))}
    </div>
  );
}
