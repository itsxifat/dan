"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  createRoom, updateRoom, deleteRoom, updateRoomStatus,
} from "@/actions/accommodation/roomActions";
import {
  createCategory, updateCategory, deleteCategory,
  getCategoriesByProperty,
} from "@/actions/accommodation/categoryActions";
import AdminSelect from "@/components/admin/AdminSelect";
import ImageUpload from "@/components/ui/ImageUpload";
import MultiImageUpload from "@/components/ui/MultiImageUpload";

const EASE = [0.16, 1, 0.3, 1];

const ROOM_STATUSES = ["available", "occupied", "maintenance", "blocked"];
const STATUS_OPTS = ROOM_STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }));
const STATUS_COLOR = {
  available:   "text-emerald-400 bg-emerald-400/10 border-emerald-400/25",
  occupied:    "text-amber-400 bg-amber-400/10 border-amber-400/25",
  maintenance: "text-orange-400 bg-orange-400/10 border-orange-400/25",
  blocked:     "text-red-400 bg-red-400/10 border-red-400/25",
};

const BED_TYPES = ["Single", "Double", "Twin", "King", "Queen", "Triple", "Bunk", "Sofa Bed"];

const INPUT = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-[12.5px] text-white placeholder-white/20 focus:outline-none focus:border-[#7A2267]/60 transition-all duration-200";
const LABEL = "block text-[10px] uppercase tracking-wider text-white/35 font-semibold mb-1.5";

// ═══════════════════════════════════════════════════════
// Room Form
// ═══════════════════════════════════════════════════════

function RoomForm({ properties, allCategories, room = null, onDone }) {
  const isEdit = !!room;
  const [isPending, startTransition] = useTransition();
  const [error, setError]     = useState("");
  const [showImages, setShowImages] = useState(false);

  const defaultPropId = room?.property?._id ?? room?.property ?? (properties[0]?._id ?? "");

  const getCats = (pid) => allCategories.filter(
    (c) => String(c.property?._id ?? c.property) === String(pid)
  );

  const [selectedProp, setSelectedProp] = useState(defaultPropId);
  const initCats = getCats(defaultPropId);

  const initCatId = room?.category?._id ?? room?.category ?? (initCats[0]?._id ?? "");
  const initVariants = allCategories.find((c) => String(c._id) === String(initCatId))?.variants ?? [];

  const [form, setForm] = useState({
    property:      defaultPropId,
    category:      initCatId,
    variantId:     room?.variantId     ?? "",
    pricePerNight: room?.pricePerNight ?? 0,
    roomNumber:    room?.roomNumber    ?? "",
    floor:         String(room?.floor ?? 1),
    block:         room?.block         ?? "",
    row:           room?.row           ?? "",
    facing:        room?.facing        ?? "",
    status:        room?.status        ?? "available",
    coverImage:    room?.coverImage    ?? "",
    images:        room?.images        ?? [],
    description:   room?.description   ?? "",
    notes:         room?.notes         ?? "",
  });

  const [categoryVariants, setCategoryVariants] = useState(initVariants);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function handlePropertySelect(pid) {
    setSelectedProp(pid);
    const cats = getCats(pid);
    const firstCatId = cats[0]?._id ?? "";
    const variants = allCategories.find((c) => String(c._id) === String(firstCatId))?.variants ?? [];
    setCategoryVariants(variants);
    setForm((f) => ({ ...f, property: pid, category: firstCatId, variantId: "" }));
  }

  function handleCategorySelect(catId) {
    const variants = allCategories.find((c) => String(c._id) === String(catId))?.variants ?? [];
    setCategoryVariants(variants);
    setForm((f) => ({ ...f, category: catId, variantId: "" }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.category) { setError("Select a room category."); return; }
    startTransition(async () => {
      try {
        const data = {
          property:      form.property,
          category:      form.category,
          variantId:     form.variantId || null,
          pricePerNight: Number(form.pricePerNight) || 0,
          roomNumber:    form.roomNumber,
          floor:         Number(form.floor),
          block:         form.block,
          row:           form.row,
          facing:        form.facing,
          status:        form.status,
          coverImage:    form.coverImage,
          images:        form.images,
          description:   form.description,
          notes:         form.notes,
        };
        isEdit ? await updateRoom(room._id, data) : await createRoom(data);
        onDone();
      } catch (err) {
        setError(err.message || "Something went wrong.");
      }
    });
  }

  const currentCats = getCats(selectedProp);
  const propOptions = properties.map((p) => ({ value: p._id, label: p.name }));
  const catOptions  = currentCats.map((c) => ({
    value: c._id,
    label: c.name,
    sub: c.variants?.length > 0
      ? `${c.variants.length} type${c.variants.length > 1 ? "s" : ""}`
      : undefined,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-[11.5px] text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Property */}
        <div className="col-span-2 sm:col-span-1">
          <label className={LABEL}>Property *</label>
          <AdminSelect
            options={propOptions}
            value={form.property}
            onChange={handlePropertySelect}
            placeholder="Select property…"
          />
        </div>

        {/* Category */}
        <div className="col-span-2 sm:col-span-1">
          <label className={LABEL}>Category *</label>
          {catOptions.length === 0 ? (
            <div className="w-full bg-amber-400/5 border border-amber-400/20 rounded-xl px-3.5 py-2.5
              text-[12px] text-amber-400/70">
              No categories for this property
            </div>
          ) : (
            <AdminSelect
              options={catOptions}
              value={form.category}
              onChange={handleCategorySelect}
              placeholder="Select category…"
            />
          )}
        </div>

        {/* Variant — shown only if category has variants */}
        {categoryVariants.length > 0 && (
          <div className="col-span-2">
            <label className={LABEL}>Room Type / Variant</label>
            <AdminSelect
              options={[
                { value: "", label: "No variant (use category default)" },
                ...categoryVariants.map((v) => ({
                  value: String(v._id),
                  label: `${v.name} — ${v.bedType} · ৳${Number(v.pricePerNight).toLocaleString()}/night`,
                })),
              ]}
              value={form.variantId}
              onChange={(v) => setForm((f) => ({ ...f, variantId: v }))}
            />
            {form.variantId && (() => {
              const v = categoryVariants.find((x) => String(x._id) === form.variantId);
              return v ? (
                <p className="text-[10.5px] text-white/30 mt-1.5 flex gap-3">
                  <span>{v.bedType} bed</span>
                  {v.maxAdults > 0 && <span>· max {v.maxAdults} adults</span>}
                  {v.maxChildren > 0 && <span>· {v.maxChildren} children</span>}
                </p>
              ) : null;
            })()}
          </div>
        )}

        {/* Price Override */}
        <div className="col-span-2 sm:col-span-1">
          <label className={LABEL}>Room Price Override (BDT)</label>
          <input type="number" className={INPUT} value={form.pricePerNight} onChange={set("pricePerNight")} min="0" placeholder="0 = use variant price" />
          <p className="text-[10px] text-white/20 mt-1">Leave 0 to inherit from variant. Set a custom price for this specific room only.</p>
        </div>

        {/* Room number */}
        <div>
          <label className={LABEL}>Room Number *</label>
          <input className={INPUT} value={form.roomNumber} onChange={set("roomNumber")} placeholder="e.g. 301" required />
        </div>

        {/* Floor */}
        <div>
          <label className={LABEL}>Floor</label>
          <input type="number" className={INPUT} value={form.floor} onChange={set("floor")} min="1" />
        </div>

        {/* Block */}
        <div>
          <label className={LABEL}>Block / Wing</label>
          <input className={INPUT} value={form.block} onChange={set("block")} placeholder="e.g. Block A, North Wing" />
        </div>

        {/* Row */}
        <div>
          <label className={LABEL}>Row / Corridor</label>
          <input className={INPUT} value={form.row} onChange={set("row")} placeholder="e.g. Row 1, Corridor A" />
        </div>

        {/* Facing */}
        <div className="col-span-2">
          <label className={LABEL}>Facing / View</label>
          <input className={INPUT} value={form.facing} onChange={set("facing")} placeholder="e.g. Garden, Street, Opposite Block, Pool View" />
        </div>

        {/* Status */}
        <div className="col-span-2 sm:col-span-1">
          <label className={LABEL}>Status</label>
          <AdminSelect
            options={STATUS_OPTS}
            value={form.status}
            onChange={(v) => setForm((f) => ({ ...f, status: v }))}
          />
        </div>

        {/* Description */}
        <div className="col-span-2">
          <label className={LABEL}>Description</label>
          <textarea className={`${INPUT} resize-none`} rows={2} value={form.description}
            onChange={set("description")} placeholder="Short room description (optional)" />
        </div>

        {/* Notes */}
        <div className="col-span-2">
          <label className={LABEL}>Notes (internal)</label>
          <input className={INPUT} value={form.notes} onChange={set("notes")} placeholder="Optional staff notes…" />
        </div>
      </div>

      {/* Images — collapsible */}
      <div className="border border-white/6 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowImages((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left text-[11.5px]
            font-medium text-white/50 hover:text-white/75 hover:bg-white/[0.02] transition-all"
        >
          <span>Images</span>
          <motion.svg animate={{ rotate: showImages ? 180 : 0 }} transition={{ duration: 0.2 }}
            viewBox="0 0 10 6" width="9" height="9" fill="none">
            <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        </button>
        <AnimatePresence>
          {showImages && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
              <div className="px-4 pb-4 space-y-4 border-t border-white/6 pt-3">
                <div>
                  <label className={LABEL}>Cover Image</label>
                  <ImageUpload dark value={form.coverImage}
                    onChange={(url) => setForm((f) => ({ ...f, coverImage: url }))} />
                </div>
                <div>
                  <label className={LABEL}>Gallery Images</label>
                  <MultiImageUpload dark values={form.images}
                    onChange={(urls) => setForm((f) => ({ ...f, images: urls }))} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2">
        <button type="submit" disabled={isPending}
          className="px-5 py-2 rounded-xl bg-[#7A2267] text-white text-[12px] font-semibold
            hover:bg-[#8e2878] disabled:opacity-50 transition-colors">
          {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Room"}
        </button>
        <button type="button" onClick={onDone}
          className="px-4 py-2 text-[12px] text-white/30 hover:text-white/60 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ═══════════════════════════════════════════════════════
// Category Form (inline within Categories tab)
// ═══════════════════════════════════════════════════════

const BLANK_VARIANT = { name: "", bedType: "Double", pricePerNight: 0, maxAdults: 2, maxChildren: 0 };

function CategoryForm({ propertyId, category = null, onDone }) {
  const isEdit = !!category;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

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
    isActive:      category?.isActive      ?? true,
    sortOrder:     category?.sortOrder     ?? 0,
  });

  // ── Variants state ──────────────────────────────────────────────────────────
  const [variants, setVariants]       = useState(category?.variants ?? []);

  // Auto-sync price and bedTypes from variants when they change
  const variantBedTypes = [...new Set(variants.map((v) => v.bedType).filter(Boolean))];
  const variantMinPrice = variants.length > 0 ? Math.min(...variants.map((v) => Number(v.pricePerNight) || 0)) : null;
  const variantMaxPrice = variants.length > 0 ? Math.max(...variants.map((v) => Number(v.pricePerNight) || 0)) : null;

  const [editingVIdx, setEditingVIdx] = useState(null); // index being edited, or "new"
  const [vForm, setVForm]             = useState(BLANK_VARIANT);
  const [vError, setVError]           = useState("");

  function openAddVariant() {
    setVForm(BLANK_VARIANT);
    setVError("");
    setEditingVIdx("new");
  }

  function openEditVariant(idx) {
    const v = variants[idx];
    setVForm({
      name:          v.name,
      bedType:       v.bedType,
      pricePerNight: v.pricePerNight,
      maxAdults:     v.maxAdults ?? 2,
      maxChildren:   v.maxChildren ?? 0,
    });
    setVError("");
    setEditingVIdx(idx);
  }

  function saveVariant() {
    if (!vForm.name.trim())            { setVError("Variant name is required."); return; }
    if (!vForm.pricePerNight || vForm.pricePerNight < 0) { setVError("Price must be ≥ 0."); return; }
    setVError("");
    if (editingVIdx === "new") {
      setVariants((prev) => [...prev, { ...vForm, pricePerNight: Number(vForm.pricePerNight), maxAdults: Number(vForm.maxAdults), maxChildren: Number(vForm.maxChildren) }]);
    } else {
      setVariants((prev) => prev.map((v, i) => i === editingVIdx
        ? { ...vForm, pricePerNight: Number(vForm.pricePerNight), maxAdults: Number(vForm.maxAdults), maxChildren: Number(vForm.maxChildren) }
        : v
      ));
    }
    setEditingVIdx(null);
  }

  function removeVariant(idx) {
    setVariants((prev) => prev.filter((_, i) => i !== idx));
    if (editingVIdx === idx) setEditingVIdx(null);
  }

  // ── Form helpers ────────────────────────────────────────────────────────────
  const set    = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setNum = (key) => (e) => setForm((f) => ({ ...f, [key]: Number(e.target.value) }));
  const bedOpts = BED_TYPES.map((b) => ({ value: b, label: b }));

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (variants.length === 0) {
      setError("At least one room type/variant is required. Add a variant with bed type and price.");
      return;
    }
    startTransition(async () => {
      try {
        const data = {
          ...form,
          pricePerNight: variantMinPrice ?? 0,
          bedType:       "",
          maxAdults:     Number(form.maxAdults),
          maxChildren:   Number(form.maxChildren),
          sortOrder:     Number(form.sortOrder),
          variants,
        };
        isEdit ? await updateCategory(category._id, data) : await createCategory(propertyId, data);
        onDone();
      } catch (err) {
        setError(err.message || "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      {error && (
        <p className="text-[11.5px] text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={LABEL}>Category Name *</label>
          <input className={INPUT} value={form.name} onChange={set("name")} placeholder="e.g. Deluxe" required />
        </div>
        <div className="col-span-2 bg-[#7A2267]/5 border border-[#7A2267]/20 rounded-xl px-4 py-3 space-y-1.5">
          <p className="text-[10px] uppercase tracking-wider text-[#c05aae]/60 font-semibold">Pricing &amp; Bed Types — from variants</p>
          {variants.length > 0 ? (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[13px] font-bold text-white/75">
                ৳{variantMinPrice?.toLocaleString()}
                {variantMaxPrice !== variantMinPrice && ` – ৳${variantMaxPrice?.toLocaleString()}`}
                <span className="text-[10px] font-normal text-white/35 ml-1">/night</span>
              </span>
              {variantBedTypes.map((b) => (
                <span key={b} className="text-[10.5px] text-[#c05aae]/70 bg-[#7A2267]/10 border border-[#7A2267]/20 px-2 py-0.5 rounded-full">
                  {b}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-amber-400/70">⚠ Add at least one room type/variant below — price and bed type are required.</p>
          )}
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
          <input className={INPUT} value={form.size} onChange={set("size")} placeholder="35 sqm" />
        </div>
        <div>
          <label className={LABEL}>Floor Range</label>
          <input className={INPUT} value={form.floorRange} onChange={set("floorRange")} placeholder="3–7" />
        </div>
        <div className="col-span-2">
          <label className={LABEL}>Cover Image</label>
          <ImageUpload dark value={form.coverImage}
            onChange={(url) => setForm((f) => ({ ...f, coverImage: url }))} />
        </div>
        <div>
          <label className={LABEL}>Sort Order</label>
          <input type="number" className={INPUT} value={form.sortOrder} onChange={setNum("sortOrder")} min="0" />
        </div>
        <div className="col-span-2">
          <label className={LABEL}>Description</label>
          <textarea className={`${INPUT} resize-none`} rows={2} value={form.description}
            onChange={set("description")} placeholder="Describe this category…" />
        </div>
      </div>

      {/* ── Variants Section ──────────────────────────────────────────────── */}
      <div className="border border-white/8 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02]">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-white/40 font-semibold">Room Types / Variants</p>
            <p className="text-[10px] text-white/20 mt-0.5">
              Add different bed types &amp; prices within this category (e.g. Single, Twin, Couple)
            </p>
          </div>
          {editingVIdx === null && (
            <button type="button" onClick={openAddVariant}
              className="flex items-center gap-1.5 text-[11px] text-[#c05aae] hover:text-white
                transition-colors border border-[#7A2267]/30 hover:border-[#7A2267]/60 rounded-lg px-3 py-1.5">
              <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
                <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Add Type
            </button>
          )}
        </div>

        <div className="divide-y divide-white/5">
          {/* Existing variants */}
          {variants.map((v, i) => (
            editingVIdx === i ? (
              <VariantEditRow
                key={i}
                vForm={vForm}
                setVForm={setVForm}
                vError={vError}
                bedOpts={bedOpts}
                onSave={saveVariant}
                onCancel={() => setEditingVIdx(null)}
              />
            ) : (
              <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.015] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-[#7A2267]/15 border border-[#7A2267]/20 flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-bold text-[#c05aae]">{i + 1}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-semibold text-white/75 leading-none">{v.name}</p>
                    <div className="flex gap-3 mt-0.5 flex-wrap">
                      <span className="text-[10.5px] text-white/35">{v.bedType} bed</span>
                      <span className="text-[10.5px] text-[#c05aae]/70 font-semibold">৳{Number(v.pricePerNight).toLocaleString()}/night</span>
                      {v.maxAdults > 0 && <span className="text-[10.5px] text-white/25">{v.maxAdults} adults</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button type="button" onClick={() => openEditVariant(i)}
                    className="text-[10.5px] text-white/30 hover:text-white/65 transition-colors">Edit</button>
                  <span className="text-white/15">·</span>
                  <button type="button" onClick={() => removeVariant(i)}
                    className="text-[10.5px] text-red-400/40 hover:text-red-400 transition-colors">Remove</button>
                </div>
              </div>
            )
          ))}

          {/* Add new variant form */}
          {editingVIdx === "new" && (
            <VariantEditRow
              vForm={vForm}
              setVForm={setVForm}
              vError={vError}
              bedOpts={bedOpts}
              onSave={saveVariant}
              onCancel={() => setEditingVIdx(null)}
              isNew
            />
          )}

          {variants.length === 0 && editingVIdx === null && (
            <div className="px-4 py-4 text-center text-[11px] text-amber-400/50">
              No room types yet — add at least one variant with a bed type and price to save this category.
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button type="submit" disabled={isPending}
          className="px-5 py-2 rounded-xl bg-[#7A2267] text-white text-[12px] font-semibold
            hover:bg-[#8e2878] disabled:opacity-50 transition-colors">
          {isPending ? "Saving…" : isEdit ? "Save" : "Add Category"}
        </button>
        <button type="button" onClick={onDone}
          className="px-4 py-2 text-[12px] text-white/30 hover:text-white/60 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Variant inline edit row ──────────────────────────────────────────────────

function VariantEditRow({ vForm, setVForm, vError, bedOpts, onSave, onCancel, isNew = false }) {
  const sv = (key) => (e) => setVForm((f) => ({ ...f, [key]: e.target.value }));
  return (
    <div className="px-4 py-4 bg-[#7A2267]/5 border-t border-[#7A2267]/15 space-y-3">
      <p className="text-[10px] uppercase tracking-wider text-[#c05aae]/50 font-semibold">
        {isNew ? "New Room Type" : "Edit Room Type"}
      </p>
      {vError && <p className="text-[11px] text-red-400">{vError}</p>}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className={LABEL}>Type Name *</label>
          <input className={INPUT} value={vForm.name} onChange={sv("name")} placeholder="e.g. Twin Room" />
        </div>
        <div>
          <label className={LABEL}>Bed Type</label>
          <AdminSelect options={bedOpts} value={vForm.bedType}
            onChange={(v) => setVForm((f) => ({ ...f, bedType: v }))} />
        </div>
        <div>
          <label className={LABEL}>Price / Night *</label>
          <input type="number" className={INPUT} value={vForm.pricePerNight} onChange={sv("pricePerNight")} min="0" />
        </div>
        <div>
          <label className={LABEL}>Max Adults</label>
          <input type="number" className={INPUT} value={vForm.maxAdults} onChange={sv("maxAdults")} min="1" />
        </div>
        <div>
          <label className={LABEL}>Max Children</label>
          <input type="number" className={INPUT} value={vForm.maxChildren} onChange={sv("maxChildren")} min="0" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onSave}
          className="px-4 py-1.5 rounded-lg bg-[#7A2267] text-white text-[11.5px] font-semibold
            hover:bg-[#8e2878] transition-colors">
          {isNew ? "Add" : "Update"}
        </button>
        <button type="button" onClick={onCancel}
          className="text-[11.5px] text-white/30 hover:text-white/60 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Categories Tab
// ═══════════════════════════════════════════════════════

function CategoriesTab({ properties, initialCategories, initialPropertyId }) {
  const [selPropId, setSelPropId]   = useState(initialPropertyId ?? "");
  const [categories, setCategories] = useState(
    initialPropertyId
      ? initialCategories.filter((c) => String(c.property?._id ?? c.property) === String(initialPropertyId))
      : initialCategories
  );
  const [loading, setLoading]       = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [showAdd, setShowAdd]       = useState(false);
  const [deletingId, setDelId]      = useState(null);
  const [delError, setDelError]     = useState("");
  const [isPending, startTrans]     = useTransition();

  const propOptions = properties.map((p) => ({ value: p._id, label: p.name }));

  async function loadCategories(pid) {
    setLoading(true);
    try {
      const cats = await getCategoriesByProperty(pid);
      setCategories(cats);
    } finally {
      setLoading(false);
    }
  }

  function handlePropChange(pid) {
    setSelPropId(pid);
    setEditingId(null);
    setShowAdd(false);
    if (pid) loadCategories(pid);
    else setCategories([]);
  }

  function onFormDone() {
    setEditingId(null);
    setShowAdd(false);
    if (selPropId) loadCategories(selPropId);
  }

  function handleDelete(catId) {
    setDelError("");
    setDelId(catId);
    startTrans(async () => {
      try {
        await deleteCategory(catId);
        setCategories((prev) => prev.filter((c) => c._id !== catId));
      } catch (err) {
        setDelError(err.message || "Delete failed.");
      } finally {
        setDelId(null);
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* Property selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-72">
          <AdminSelect
            options={propOptions}
            value={selPropId}
            onChange={handlePropChange}
            placeholder="Select a property…"
          />
        </div>
        {selPropId && !showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7A2267] text-white
              text-[12px] font-semibold hover:bg-[#8e2878] transition-colors"
          >
            <svg viewBox="0 0 12 12" width="11" height="11" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Add Category
          </button>
        )}
      </div>

      {!selPropId ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center">
            <svg viewBox="0 0 18 18" width="16" height="16" fill="none" className="text-white/20">
              <path d="M2 16V8.5L9 3l7 5.5V16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="6.5" y="11" width="5" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </div>
          <p className="text-[13px] text-white/30 font-medium">Select a property to manage its categories</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-5 h-5 rounded-full border-2 border-white/10 border-t-[#7A2267]" />
        </div>
      ) : (
        <div className="space-y-3">
          {delError && (
            <p className="text-[11.5px] text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
              {delError}
            </p>
          )}

          {/* Add form */}
          <AnimatePresence>
            {showAdd && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
                className="bg-white/2 border border-[#7A2267]/25 rounded-2xl p-5">
                <p className="text-[11px] uppercase tracking-wider text-[#c05aae]/60 font-semibold mb-1">New Category</p>
                <CategoryForm propertyId={selPropId} onDone={onFormDone} />
              </motion.div>
            )}
          </AnimatePresence>

          {categories.length === 0 && !showAdd ? (
            <div className="text-center py-12 text-white/20 text-[13px]">
              No categories yet for this property.
            </div>
          ) : (
            categories.map((cat) => (
              <div key={cat._id} className="bg-white/2 border border-white/6 rounded-xl p-4">
                {editingId === cat._id ? (
                  <CategoryForm propertyId={selPropId} category={cat} onDone={onFormDone} />
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3 flex-1 min-w-0">
                      {cat.coverImage && (
                        <img src={cat.coverImage} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0 opacity-80" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13px] font-semibold text-white/80">{cat.name}</span>
                          {!cat.isActive && (
                            <span className="text-[9px] uppercase tracking-wider bg-white/5 text-white/30 border border-white/10 px-2 py-0.5 rounded-full">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="flex gap-3 mt-1 flex-wrap items-center">
                          <span className="text-[11px] text-white/35">৳{cat.pricePerNight?.toLocaleString()}/night</span>
                          <span className="text-[11px] text-white/25">{cat.bedType}</span>
                          {cat.size && <span className="text-[11px] text-white/25">{cat.size}</span>}
                          {cat.variants?.length > 0 && (
                            <span className="text-[10px] text-[#c05aae]/60 bg-[#7A2267]/10 border border-[#7A2267]/20 px-2 py-0.5 rounded-full">
                              {cat.variants.length} type{cat.variants.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        {cat.variants?.length > 0 && (
                          <div className="flex gap-2 mt-1.5 flex-wrap">
                            {cat.variants.map((v, i) => (
                              <span key={i} className="text-[10px] text-white/30 bg-white/4 border border-white/8 px-2 py-0.5 rounded-full">
                                {v.name} · {v.bedType} · ৳{Number(v.pricePerNight).toLocaleString()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => setEditingId(cat._id)}
                        className="text-[11px] text-white/30 hover:text-white/65 px-3 py-1.5 rounded-lg
                          border border-white/7 hover:border-white/15 transition-all">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(cat._id)}
                        disabled={isPending && deletingId === cat._id}
                        className="text-[11px] text-red-400/50 hover:text-red-400 px-3 py-1.5 rounded-lg
                          border border-red-500/10 hover:border-red-500/30 transition-all disabled:opacity-40">
                        {deletingId === cat._id ? "…" : "Delete"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Rooms Tab
// ═══════════════════════════════════════════════════════

function RoomsTab({ initialRooms, properties, allCategories, filterPropertyId, filterCategoryId, canWrite }) {
  const router   = useRouter();
  const pathname = usePathname();
  const qs       = useSearchParams();

  const [rooms, setRooms]         = useState(initialRooms);
  const [showAdd, setShowAdd]     = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDelId]    = useState(null);
  const [error, setError]         = useState("");
  const [isPending, startTrans]   = useTransition();

  function applyFilter(updates) {
    const p = new URLSearchParams(qs.toString());
    Object.entries(updates).forEach(([k, v]) => v ? p.set(k, v) : p.delete(k));
    router.push(`${pathname}?${p.toString()}`);
  }

  function onDone() {
    setShowAdd(false);
    setEditingId(null);
    router.refresh();
  }

  function handleDelete(roomId) {
    setError("");
    setDelId(roomId);
    startTrans(async () => {
      try {
        await deleteRoom(roomId);
        setRooms((prev) => prev.filter((r) => r._id !== roomId));
      } catch (err) {
        setError(err.message || "Delete failed.");
      } finally {
        setDelId(null);
      }
    });
  }

  function handleStatusChange(roomId, status) {
    startTrans(async () => {
      try {
        await updateRoomStatus(roomId, status);
        setRooms((prev) => prev.map((r) => r._id === roomId ? { ...r, status } : r));
      } catch (err) {
        setError(err.message || "Status update failed.");
      }
    });
  }

  const propOptions = [
    { value: "", label: "All Properties" },
    ...properties.map((p) => ({ value: p._id, label: p.name })),
  ];
  const catOptions = [
    { value: "", label: "All Categories" },
    ...(filterPropertyId
      ? allCategories.filter((c) => String(c.property?._id ?? c.property) === String(filterPropertyId))
      : allCategories
    ).map((c) => ({ value: c._id, label: c.name })),
  ];

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2 flex-1">
          <div className="w-48">
            <AdminSelect options={propOptions} value={filterPropertyId ?? ""}
              onChange={(v) => applyFilter({ property: v, category: "" })}
              placeholder="All Properties" />
          </div>
          <div className="w-48">
            <AdminSelect options={catOptions} value={filterCategoryId ?? ""}
              onChange={(v) => applyFilter({ category: v })}
              placeholder="All Categories" />
          </div>
        </div>
        {canWrite && !showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7A2267] text-white
              text-[12px] font-semibold hover:bg-[#8e2878] transition-colors shrink-0"
          >
            <svg viewBox="0 0 12 12" width="11" height="11" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Add Room
          </button>
        )}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
            className="bg-white/2 border border-[#7A2267]/25 rounded-2xl p-5">
            <p className="text-[11px] uppercase tracking-wider text-[#c05aae]/60 font-semibold mb-4">New Room</p>
            <RoomForm properties={properties} allCategories={allCategories} onDone={onDone} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-[11.5px] text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Table */}
      {rooms.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center">
            <svg viewBox="0 0 20 20" width="18" height="18" fill="none" className="text-white/20">
              <rect x="2" y="5" width="16" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M2 9h16M7 5V3M13 5V3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-[13px] text-white/35 font-medium">No rooms found</p>
          <p className="text-[11.5px] text-white/20">
            {canWrite ? 'Click "Add Room" to create your first room.' : "No rooms have been added yet."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/6">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-white/6">
                {["Room #", "Property", "Category", "Floor", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[9.5px] uppercase tracking-wider text-white/25 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room._id} className="border-b border-white/4 hover:bg-white/2 transition-colors">
                  {editingId === room._id ? (
                    <td colSpan={6} className="px-4 py-4">
                      <RoomForm properties={properties} allCategories={allCategories} room={room} onDone={onDone} />
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {room.coverImage && (
                            <img src={room.coverImage} alt="" className="w-7 h-7 rounded-lg object-cover opacity-75 shrink-0" />
                          )}
                          <span className="text-white/75 font-mono font-medium">{room.roomNumber}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white/40">{room.property?.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className="text-white/40">{room.category?.name ?? "—"}</span>
                        {room.variantId && room.category?.variants?.length > 0 && (() => {
                          const v = room.category.variants.find((x) => String(x._id) === String(room.variantId));
                          return v ? (
                            <span className="ml-1.5 text-[10px] text-[#c05aae]/60 bg-[#7A2267]/10 border border-[#7A2267]/20 px-1.5 py-0.5 rounded-full">
                              {v.name}
                            </span>
                          ) : null;
                        })()}
                      </td>
                      <td className="px-4 py-3 text-white/35">{room.floor}</td>
                      <td className="px-4 py-3">
                        {canWrite ? (
                          <AdminSelect
                            size="sm"
                            options={STATUS_OPTS}
                            value={room.status}
                            onChange={(v) => handleStatusChange(room._id, v)}
                            disabled={isPending}
                            className={`w-36! [&>button]:${STATUS_COLOR[room.status]}`}
                          />
                        ) : (
                          <span className={`text-[10.5px] uppercase tracking-wide border rounded-full px-2.5 py-1
                            font-medium ${STATUS_COLOR[room.status]}`}>
                            {room.status}
                          </span>
                        )}
                      </td>
                      {canWrite && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <button onClick={() => setEditingId(room._id)}
                              className="text-[10.5px] text-white/30 hover:text-white/65 transition-colors">
                              Edit
                            </button>
                            <span className="text-white/15">·</span>
                            <button onClick={() => handleDelete(room._id)}
                              disabled={isPending && deletingId === room._id}
                              className="text-[10.5px] text-red-400/40 hover:text-red-400 transition-colors disabled:opacity-40">
                              {deletingId === room._id ? "…" : "Delete"}
                            </button>
                          </div>
                        </td>
                      )}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Root export
// ═══════════════════════════════════════════════════════

export default function RoomsManager({
  rooms,
  properties,
  categories,
  filterPropertyId,
  filterCategoryId,
  canWrite,
}) {
  const [tab, setTab] = useState("rooms");

  const tabs = [
    { key: "rooms",      label: "Rooms",      count: rooms.length },
    { key: "categories", label: "Categories", count: categories.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[18px] font-semibold text-white/85 leading-tight">Room Management</h2>
          <p className="text-[11.5px] text-white/30 mt-0.5">Manage rooms and room categories</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/3 border border-white/6 rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-all duration-200
              ${tab === t.key ? "bg-white/8 text-white shadow-sm" : "text-white/30 hover:text-white/60"}`}
          >
            {t.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full
              ${tab === t.key ? "bg-white/10 text-white/60" : "text-white/20"}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: EASE }}
        >
          {tab === "rooms" && (
            <RoomsTab
              initialRooms={rooms}
              properties={properties}
              allCategories={categories}
              filterPropertyId={filterPropertyId}
              filterCategoryId={filterCategoryId}
              canWrite={canWrite}
            />
          )}
          {tab === "categories" && (
            <CategoriesTab
              properties={properties}
              initialCategories={categories}
              initialPropertyId={filterPropertyId}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
