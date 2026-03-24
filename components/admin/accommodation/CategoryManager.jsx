"use client";

import { useState, useTransition } from "react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/actions/accommodation/categoryActions";
import ImageUpload from "@/components/ui/ImageUpload";

const BED_TYPES = ["Single", "Double", "Twin", "King", "Queen", "Bunk", "Sofa Bed"];
const VARIANT_BED_TYPES = ["Single", "Double", "Twin", "King", "Queen", "Bunk", "Sofa Bed", "Triple"];

const BLANK_VARIANT = { name: "", bedType: "Double", pricePerNight: 0, maxAdults: 2, maxChildren: 0, description: "" };

const INPUT = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-[12.5px] text-white placeholder-white/20 focus:outline-none focus:border-[#7A2267]/60 transition-all duration-200";
const LABEL = "block text-[10px] uppercase tracking-wider text-white/35 font-semibold mb-1.5";

function CategoryForm({ propertyId, category = null, onDone }) {
  const isEdit = !!category;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [variants, setVariants] = useState(category?.variants ?? []);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [editingVariantIdx, setEditingVariantIdx] = useState(null);
  const [variantForm, setVariantForm] = useState(BLANK_VARIANT);

  const [form, setForm] = useState({
    name:         category?.name          ?? "",
    description:  category?.description   ?? "",
    coverImage:   category?.coverImage    ?? "",
    pricePerNight:category?.pricePerNight ?? 0,
    maxAdults:    category?.maxAdults     ?? 2,
    maxChildren:  category?.maxChildren   ?? 2,
    bedType:      category?.bedType       ?? "Double",
    size:         category?.size          ?? "",
    floorRange:   category?.floorRange    ?? "",
    isActive:     category?.isActive      ?? true,
    sortOrder:    category?.sortOrder     ?? 0,
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setNum = (key) => (e) => setForm((f) => ({ ...f, [key]: Number(e.target.value) }));

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        const data = {
          ...form,
          pricePerNight: Number(form.pricePerNight),
          maxAdults:     Number(form.maxAdults),
          maxChildren:   Number(form.maxChildren),
          sortOrder:     Number(form.sortOrder),
          variants:      variants.map((v) => ({
            ...v,
            pricePerNight: Number(v.pricePerNight),
            maxAdults:     Number(v.maxAdults),
            maxChildren:   Number(v.maxChildren),
          })),
        };
        if (isEdit) {
          await updateCategory(category._id, data);
        } else {
          await createCategory(propertyId, data);
        }
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
          <input className={INPUT} value={form.name} onChange={set("name")} placeholder="e.g. Deluxe Double" required />
        </div>
        <div>
          <label className={LABEL}>Price / Night (BDT) *</label>
          <input type="number" className={INPUT} value={form.pricePerNight} onChange={setNum("pricePerNight")} min="0" required />
        </div>
        <div>
          <label className={LABEL}>Bed Type</label>
          <select className={INPUT} value={form.bedType} onChange={set("bedType")}>
            {BED_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
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
          <label className={LABEL}>Room Size (e.g. 35 sqm)</label>
          <input className={INPUT} value={form.size} onChange={set("size")} placeholder="35 sqm" />
        </div>
        <div>
          <label className={LABEL}>Floor Range (e.g. 3–7)</label>
          <input className={INPUT} value={form.floorRange} onChange={set("floorRange")} placeholder="3–7" />
        </div>
        <div className="col-span-2">
          <label className={LABEL}>Cover Image</label>
          <ImageUpload
            dark
            value={form.coverImage}
            onChange={(url) => setForm((f) => ({ ...f, coverImage: url }))}
          />
        </div>
        <div>
          <label className={LABEL}>Sort Order</label>
          <input type="number" className={INPUT} value={form.sortOrder} onChange={setNum("sortOrder")} min="0" />
        </div>
        <div className="col-span-2">
          <label className={LABEL}>Description</label>
          <textarea className={`${INPUT} resize-none`} rows={3} value={form.description} onChange={set("description")} placeholder="Describe this category..." />
        </div>
      </div>
      {/* Variants Manager */}
      <div className="border border-white/[0.08] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <p className="text-[10px] uppercase tracking-wider text-white/35 font-semibold">Room Variants</p>
          <button type="button" onClick={() => { setVariantForm(BLANK_VARIANT); setEditingVariantIdx(null); setShowVariantForm((v) => !v); }}
            className="text-[11px] text-[#c05aae]/70 hover:text-[#c05aae] transition-colors duration-200">
            + Add Variant
          </button>
        </div>

        {variants.length > 0 && (
          <div className="divide-y divide-white/[0.04]">
            {variants.map((v, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 bg-white/[0.02]">
                {editingVariantIdx === i ? (
                  <div className="w-full space-y-3 py-1">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={LABEL}>Name *</label>
                        <input className={INPUT} value={variantForm.name} onChange={(e) => setVariantForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Twin Sharing" />
                      </div>
                      <div>
                        <label className={LABEL}>Bed Type</label>
                        <select className={INPUT} value={variantForm.bedType} onChange={(e) => setVariantForm((f) => ({ ...f, bedType: e.target.value }))}>
                          {VARIANT_BED_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={LABEL}>Price / Night (BDT) *</label>
                        <input type="number" className={INPUT} value={variantForm.pricePerNight} onChange={(e) => setVariantForm((f) => ({ ...f, pricePerNight: e.target.value }))} min="0" />
                      </div>
                      <div>
                        <label className={LABEL}>Max Adults</label>
                        <input type="number" className={INPUT} value={variantForm.maxAdults} onChange={(e) => setVariantForm((f) => ({ ...f, maxAdults: e.target.value }))} min="1" />
                      </div>
                      <div>
                        <label className={LABEL}>Max Children</label>
                        <input type="number" className={INPUT} value={variantForm.maxChildren} onChange={(e) => setVariantForm((f) => ({ ...f, maxChildren: e.target.value }))} min="0" />
                      </div>
                      <div>
                        <label className={LABEL}>Description</label>
                        <input className={INPUT} value={variantForm.description} onChange={(e) => setVariantForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { setVariants((prev) => prev.map((x, j) => j === i ? { ...x, ...variantForm } : x)); setEditingVariantIdx(null); }}
                        className="px-4 py-1.5 rounded-lg bg-[#7A2267] text-white text-[11px] font-semibold hover:bg-[#8e2878] transition-colors">
                        Save
                      </button>
                      <button type="button" onClick={() => setEditingVariantIdx(null)}
                        className="px-3 py-1.5 text-[11px] text-white/30 hover:text-white/60 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <span className="text-[12px] text-white/70 font-medium">{v.name}</span>
                      <span className="text-[11px] text-white/30 ml-2">৳{Number(v.pricePerNight).toLocaleString()}/night</span>
                      <span className="text-[11px] text-white/25 ml-2">{v.bedType} bed</span>
                      <span className="text-[11px] text-white/25 ml-2">{v.maxAdults} adults</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button type="button" onClick={() => { setVariantForm({ ...v }); setEditingVariantIdx(i); setShowVariantForm(false); }}
                        className="text-[10.5px] text-white/30 hover:text-white/65 px-2 py-1 rounded-lg border border-white/[0.07] hover:border-white/15 transition-all duration-200">
                        Edit
                      </button>
                      <button type="button" onClick={() => setVariants((prev) => prev.filter((_, j) => j !== i))}
                        className="text-[10.5px] text-red-400/50 hover:text-red-400 transition-colors duration-200">
                        ×
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {showVariantForm && (
          <div className="px-4 py-3 border-t border-white/[0.06] space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Name *</label>
                <input className={INPUT} value={variantForm.name} onChange={(e) => setVariantForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Twin Sharing" />
              </div>
              <div>
                <label className={LABEL}>Bed Type</label>
                <select className={INPUT} value={variantForm.bedType} onChange={(e) => setVariantForm((f) => ({ ...f, bedType: e.target.value }))}>
                  {VARIANT_BED_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Price / Night (BDT) *</label>
                <input type="number" className={INPUT} value={variantForm.pricePerNight} onChange={(e) => setVariantForm((f) => ({ ...f, pricePerNight: e.target.value }))} min="0" />
              </div>
              <div>
                <label className={LABEL}>Max Adults</label>
                <input type="number" className={INPUT} value={variantForm.maxAdults} onChange={(e) => setVariantForm((f) => ({ ...f, maxAdults: e.target.value }))} min="1" />
              </div>
              <div>
                <label className={LABEL}>Max Children</label>
                <input type="number" className={INPUT} value={variantForm.maxChildren} onChange={(e) => setVariantForm((f) => ({ ...f, maxChildren: e.target.value }))} min="0" />
              </div>
              <div>
                <label className={LABEL}>Description</label>
                <input className={INPUT} value={variantForm.description} onChange={(e) => setVariantForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button"
                onClick={() => { if (!variantForm.name.trim()) return; setVariants((prev) => [...prev, { ...variantForm }]); setVariantForm(BLANK_VARIANT); setShowVariantForm(false); }}
                className="px-4 py-1.5 rounded-lg bg-[#7A2267] text-white text-[11px] font-semibold hover:bg-[#8e2878] transition-colors">
                Add
              </button>
              <button type="button" onClick={() => setShowVariantForm(false)}
                className="px-3 py-1.5 text-[11px] text-white/30 hover:text-white/60 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {variants.length === 0 && !showVariantForm && (
          <p className="px-4 py-3 text-[11px] text-white/20">
            No variants. Add variants to support different bed types &amp; prices within this category.
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
          {isPending ? "Saving…" : isEdit ? "Save" : "Add Category"}
        </button>
        <button type="button" onClick={onDone} className="px-4 py-2 text-[12px] text-white/30 hover:text-white/60 transition-colors duration-200">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function CategoryManager({ propertyId, initialCategories = [] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [isPending, startTransition] = useTransition();

  function onFormDone() {
    setEditingId(null);
    setShowAddForm(false);
    // Reload to refresh server data — simple approach
    window.location.reload();
  }

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

  return (
    <div className="space-y-4">
      {deleteError && (
        <p className="text-[11.5px] text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
          {deleteError}
        </p>
      )}

      {categories.length === 0 && !showAddForm && (
        <div className="text-center py-12 text-white/20 text-[13px]">
          No categories yet. Add your first room category below.
        </div>
      )}

      <div className="space-y-3">
        {categories.map((cat) => (
          <div key={cat._id} className="bg-white/2 border border-white/6 rounded-xl p-4">
            {editingId === cat._id ? (
              <CategoryForm propertyId={propertyId} category={cat} onDone={onFormDone} />
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold text-white/80">{cat.name}</span>
                    {!cat.isActive && (
                      <span className="text-[9px] uppercase tracking-wider bg-white/5 text-white/30 border border-white/10 px-2 py-0.5 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 mt-1.5 flex-wrap">
                    <span className="text-[11px] text-white/35">৳{cat.pricePerNight?.toLocaleString()}/night</span>
                    <span className="text-[11px] text-white/25">{cat.bedType}</span>
                    {cat.roomStats && (
                      <span className="text-[11px] text-white/25">
                        {cat.roomStats.available}/{cat.roomStats.total} rooms available
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setEditingId(cat._id)}
                    className="text-[11px] text-white/30 hover:text-white/65 px-3 py-1.5 rounded-lg
                      border border-white/[0.07] hover:border-white/15 transition-all duration-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(cat._id)}
                    disabled={isPending && deletingId === cat._id}
                    className="text-[11px] text-red-400/50 hover:text-red-400 px-3 py-1.5 rounded-lg
                      border border-red-500/10 hover:border-red-500/30 transition-all duration-200 disabled:opacity-40"
                  >
                    {deletingId === cat._id ? "…" : "Delete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showAddForm ? (
        <div className="bg-white/2 border border-[#7A2267]/25 rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-[#c05aae]/60 font-semibold mb-1">New Category</p>
          <CategoryForm propertyId={propertyId} onDone={onFormDone} />
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-3 rounded-xl border border-dashed border-white/10 text-[12px]
            text-white/25 hover:text-white/50 hover:border-white/20 transition-all duration-200"
        >
          + Add Category
        </button>
      )}
    </div>
  );
}
