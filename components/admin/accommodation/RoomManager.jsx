"use client";

import { useState, useRef, useEffect, useTransition, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createRoom, updateRoom, deleteRoom, updateRoomStatus } from "@/actions/accommodation/roomActions";
import ImageUpload from "@/components/ui/ImageUpload";
import MultiImageUpload from "@/components/ui/MultiImageUpload";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROOM_STATUSES = ["available", "occupied", "maintenance", "blocked"];

const STATUS_STYLE = {
  available:   { text: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/25", dot: "bg-emerald-400" },
  occupied:    { text: "text-amber-300",   bg: "bg-amber-500/10",   border: "border-amber-500/25",   dot: "bg-amber-400"   },
  maintenance: { text: "text-orange-300",  bg: "bg-orange-500/10",  border: "border-orange-500/25",  dot: "bg-orange-400"  },
  blocked:     { text: "text-red-300",     bg: "bg-red-500/10",     border: "border-red-500/25",     dot: "bg-red-400"     },
};

const INPUT = "w-full bg-white/4 border border-white/8 rounded-xl px-3.5 py-2.5 text-[12.5px] text-white placeholder-white/20 focus:outline-none focus:border-[#7A2267]/60 transition-all duration-200";
const LABEL = "block text-[10px] uppercase tracking-wider text-white/35 font-semibold mb-1.5";

const idStr = (v) => (v && typeof v === "object" && "_id" in v ? String(v._id) : String(v ?? ""));

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronIcon({ open }) {
  return (
    <svg viewBox="0 0 10 6" width="9" height="9" fill="none"
      className={`text-white/30 transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`}>
      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" className="text-white/25 shrink-0">
      <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

// ─── CustomSelect ─────────────────────────────────────────────────────────────

function CustomSelect({ value, onChange, options, placeholder = "Select…", disabled = false, className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = options.find((o) => String(o.value) === String(value));

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 bg-white/4 border border-white/8
          rounded-xl px-3.5 py-2.5 text-[12.5px] text-left hover:border-white/15
          focus:outline-none focus:border-[#7A2267]/60 transition-all duration-200 disabled:opacity-50"
      >
        <span className={selected ? "text-white" : "text-white/25"}>{selected?.label ?? placeholder}</span>
        <ChevronIcon open={open} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scaleY: 0.96 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -4, scaleY: 0.96 }}
            transition={{ duration: 0.13, ease: "easeOut" }}
            style={{ transformOrigin: "top" }}
            className="absolute left-0 right-0 top-full mt-1.5 z-[200]
              bg-[#161616] border border-white/10 rounded-xl overflow-auto max-h-52
              shadow-2xl shadow-black/60"
          >
            {options.map((o) => (
              <button
                key={String(o.value)}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={`w-full px-3.5 py-2.5 text-left text-[12.5px] transition-colors
                  hover:bg-white/5 flex items-center justify-between gap-2
                  ${String(value) === String(o.value) ? "text-white bg-[#7A2267]/15" : "text-white/65"}`}
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

// ─── StatusPill (click-to-change) ────────────────────────────────────────────

function StatusPill({ roomId, status, onStatusChange, isPending }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.available;

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        disabled={isPending}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em]
          font-semibold px-2.5 py-1 rounded-full border cursor-pointer
          hover:brightness-110 transition-all duration-200 disabled:opacity-50
          ${s.text} ${s.bg} ${s.border}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
        {status}
        <ChevronIcon open={open} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -3, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -3, scale: 0.97 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="absolute left-0 top-full mt-1.5 z-[200]
              bg-[#161616] border border-white/10 rounded-xl overflow-hidden
              shadow-2xl shadow-black/60 min-w-[148px]"
          >
            {ROOM_STATUSES.filter((x) => x !== status).map((x) => {
              const ss = STATUS_STYLE[x];
              return (
                <button
                  key={x}
                  type="button"
                  onClick={() => { onStatusChange(roomId, x); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5
                    hover:bg-white/5 transition-colors text-[11px] uppercase tracking-[0.12em] font-semibold
                    ${ss.text}`}
                >
                  <span className={`w-2 h-2 rounded-full ${ss.dot}`} />
                  {x}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── RoomForm ─────────────────────────────────────────────────────────────────

function RoomForm({ propertyId, categories, blocks = [], room = null, onDone }) {
  const isEdit = !!room;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [showImages, setShowImages] = useState(false);

  // Resolve initial category
  const initCatId = idStr(room?.category ?? categories[0]?._id ?? "");
  const initCat   = categories.find((c) => String(c._id) === initCatId);

  const [variants, setVariants] = useState(initCat?.variants ?? []);
  const initBlock = room?.block ?? (blocks.length > 0 ? blocks[0] : "");

  const [form, setForm] = useState({
    category:         initCatId,
    roomNumber:       room?.roomNumber       ?? "",
    floor:            room?.floor            ?? 1,
    block:            initBlock,
    status:           room?.status           ?? "available",
    coverImage:       room?.coverImage       ?? "",
    images:           room?.images           ?? [],
    description:      room?.description      ?? "",
    notes:            room?.notes            ?? "",
    variantId:        room?.variantId        ? String(room.variantId) : "",
    pricePerNight:    room?.pricePerNight    ?? 0,
    pricePerDay:      room?.pricePerDay      ?? 0,
    dayLongSupported: room?.dayLongSupported ?? null,
  });

  // Find the currently selected variant
  const selectedVariant = useMemo(
    () => variants.find((v) => String(v._id) === String(form.variantId)),
    [variants, form.variantId]
  );

  // Day long support: driven by selected variant (not category)
  const variantSupportsDayLong   = selectedVariant?.supportsDayLong ?? false;
  const roomDayLongEffective     = form.dayLongSupported === null
    ? variantSupportsDayLong
    : Boolean(form.dayLongSupported);

  function handleCatChange(catId) {
    const cat = categories.find((c) => String(c._id) === catId);
    const newVariants = cat?.variants ?? [];
    setVariants(newVariants);
    setForm((f) => ({ ...f, category: catId, variantId: "" }));
  }

  function handleVariantChange(variantId) {
    setForm((f) => ({ ...f, variantId }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (blocks.length > 0 && !form.block) {
      setError("Block / Wing is required for this property.");
      return;
    }
    startTransition(async () => {
      try {
        const data = {
          property:         propertyId,
          category:         form.category,
          roomNumber:       form.roomNumber,
          floor:            Number(form.floor),
          block:            form.block || "",
          status:           form.status,
          coverImage:       form.coverImage,
          images:           form.images,
          description:      form.description,
          notes:            form.notes,
          variantId:        form.variantId || null,
          pricePerNight:    Number(form.pricePerNight),
          pricePerDay:      Number(form.pricePerDay),
          dayLongSupported: form.dayLongSupported,
        };
        isEdit ? await updateRoom(room._id, data) : await createRoom(data);
        onDone();
      } catch (err) {
        setError(err.message || "Something went wrong.");
      }
    });
  }

  const catOptions = categories.map((c) => ({
    value: String(c._id),
    label: c.name + (c.block ? ` — ${c.block}` : ""),
  }));

  const blockOptions = blocks.map((b) => ({ value: b, label: b }));

  const statusOptions = ROOM_STATUSES.map((s) => ({
    value: s,
    label: s.charAt(0).toUpperCase() + s.slice(1),
  }));

  const variantOptions = [
    { value: "", label: "— No specific variant —" },
    ...variants.map((v) => ({
      value: String(v._id),
      label: `${v.name} · ৳${Number(v.pricePerNight).toLocaleString()}/night${
        v.supportsDayLong && v.pricePerDay > 0 ? ` · ৳${Number(v.pricePerDay).toLocaleString()}/day` : ""
      } · ${v.bedType}${v.supportsDayLong ? " · Day Long ✓" : ""}`,
    })),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-3">
      {error && (
        <p className="text-[11.5px] text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Category */}
        <div>
          <label className={LABEL}>Category *</label>
          <CustomSelect
            value={form.category}
            onChange={handleCatChange}
            options={catOptions}
            placeholder="Select category…"
          />
        </div>

        {/* Room number */}
        <div>
          <label className={LABEL}>Room Number *</label>
          <input
            className={INPUT}
            value={form.roomNumber}
            onChange={(e) => setForm((f) => ({ ...f, roomNumber: e.target.value }))}
            placeholder="e.g. 301"
            required
          />
        </div>

        {/* Floor */}
        <div>
          <label className={LABEL}>Floor</label>
          <input
            type="number"
            className={INPUT}
            value={form.floor}
            onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))}
            min="1"
          />
        </div>

        {/* Block */}
        <div>
          <label className={LABEL}>
            Block / Wing{blocks.length > 0 && <span className="text-red-400 ml-1">*</span>}
          </label>
          {blocks.length > 0 ? (
            <CustomSelect
              value={form.block}
              onChange={(val) => setForm((f) => ({ ...f, block: val }))}
              options={blockOptions}
              placeholder="Select block…"
            />
          ) : (
            <input
              className={INPUT}
              value={form.block}
              onChange={(e) => setForm((f) => ({ ...f, block: e.target.value }))}
              placeholder="e.g. Block A (optional)"
            />
          )}
        </div>

        {/* Status */}
        <div>
          <label className={LABEL}>Status</label>
          <CustomSelect
            value={form.status}
            onChange={(val) => setForm((f) => ({ ...f, status: val }))}
            options={statusOptions}
          />
        </div>

        {/* Variant — if variants exist for selected category */}
        {variants.length > 0 && (
          <div className="col-span-2">
            <label className={LABEL}>Room Variant</label>
            <CustomSelect
              value={form.variantId}
              onChange={handleVariantChange}
              options={variantOptions}
            />
            {selectedVariant?.supportsDayLong && (
              <p className="mt-1.5 text-[10px] text-[#c05aae]/70 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c05aae]/60 inline-block" />
                This variant supports day long booking
              </p>
            )}
          </div>
        )}

        {/* ── Day Long Support — driven by variant ── */}
        <div className="col-span-2 bg-[#7A2267]/8 border border-[#7A2267]/20 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-wider text-[#c05aae]/60 font-semibold">Day Long Support</p>
            {variants.length > 0 && !form.variantId && (
              <p className="text-[9.5px] text-white/25">Select a variant to see its day long support</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              {
                val: null,
                label: "Inherit",
                sub: variants.length > 0
                  ? (selectedVariant
                    ? (variantSupportsDayLong ? "Variant: enabled" : "Variant: disabled")
                    : "No variant selected")
                  : "No variants",
              },
              { val: true,  label: "Force Enable",  sub: "This room only" },
              { val: false, label: "Force Disable", sub: "This room only" },
            ].map(({ val, label, sub }) => (
              <button
                key={String(val)}
                type="button"
                onClick={() => setForm((f) => ({ ...f, dayLongSupported: val }))}
                className={`text-left px-3 py-2.5 rounded-xl border-2 transition-all duration-150
                  ${form.dayLongSupported === val
                    ? "border-[#7A2267] bg-[#7A2267]/15"
                    : "border-white/7 hover:border-[#7A2267]/30"
                  }`}
              >
                <p className="text-[11.5px] font-semibold text-white/65">{label}</p>
                <p className="text-[9.5px] text-white/25 mt-0.5">{sub}</p>
              </button>
            ))}
          </div>

          {/* Day long price — shown when effective day long is true */}
          {roomDayLongEffective && (
            <div className="pt-2 border-t border-[#7A2267]/20 space-y-1">
              <label className={LABEL}>
                Day Long Price / Day (BDT)
                <span className="text-white/20 normal-case ml-1 font-normal">(0 = inherit from variant)</span>
              </label>
              {selectedVariant?.pricePerDay > 0 && (
                <p className="text-[10px] text-[#c05aae]/60 mb-1.5">
                  Variant price: ৳{Number(selectedVariant.pricePerDay).toLocaleString()}/day
                </p>
              )}
              <input
                type="number"
                className={INPUT}
                value={form.pricePerDay}
                onChange={(e) => setForm((f) => ({ ...f, pricePerDay: e.target.value }))}
                min="0"
              />
            </div>
          )}

          {form.dayLongSupported === true && !variantSupportsDayLong && (
            <p className="text-[10px] text-amber-400/70">
              ⚠ Selected variant does not support day long — this is a room-level override.
            </p>
          )}
        </div>

        {/* Night price override */}
        <div className="col-span-2 border border-white/7 rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-3">
            Night Price Override
            <span className="normal-case text-white/20 ml-1 font-normal">(0 = inherit from variant / category)</span>
          </p>
          <div>
            <label className={LABEL}>Price / Night (BDT)</label>
            <input
              type="number"
              className={INPUT}
              value={form.pricePerNight}
              onChange={(e) => setForm((f) => ({ ...f, pricePerNight: e.target.value }))}
              min="0"
            />
          </div>
        </div>

        {/* Description */}
        <div className="col-span-2">
          <label className={LABEL}>Description</label>
          <textarea
            className={`${INPUT} resize-none`}
            rows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Short room description (optional)"
          />
        </div>

        {/* Notes */}
        <div className="col-span-2">
          <label className={LABEL}>Notes (internal)</label>
          <input
            className={INPUT}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Optional staff notes…"
          />
        </div>
      </div>

      {/* Images — collapsible */}
      <div className="border border-white/6 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowImages((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3
            text-[11.5px] font-medium text-white/45 hover:text-white/70
            hover:bg-white/2 transition-all duration-200"
        >
          <span>Images (optional)</span>
          <motion.svg
            animate={{ rotate: showImages ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            viewBox="0 0 10 6" width="9" height="9" fill="none"
          >
            <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </motion.svg>
        </button>
        <AnimatePresence>
          {showImages && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-3 space-y-4 border-t border-white/6">
                <div>
                  <label className={LABEL}>Cover Image</label>
                  <ImageUpload dark value={form.coverImage} onChange={(url) => setForm((f) => ({ ...f, coverImage: url }))} />
                </div>
                <div>
                  <label className={LABEL}>Gallery Images</label>
                  <MultiImageUpload dark values={form.images} onChange={(urls) => setForm((f) => ({ ...f, images: urls }))} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2 rounded-xl bg-[#7A2267] text-white text-[12px] font-semibold
            hover:bg-[#8e2878] disabled:opacity-50 transition-colors duration-200"
        >
          {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Room"}
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

// ─── Main RoomManager ─────────────────────────────────────────────────────────

export default function RoomManager({ propertyId, categories, blocks = [], initialRooms = [], onNeedCategories }) {
  const [rooms,      setRooms]    = useState(initialRooms);
  const [editingId,  setEditing]  = useState(null);
  const [showAdd,    setShowAdd]  = useState(false);
  const [confirmDel, setConfirm]  = useState(null);
  const [error,      setError]    = useState("");
  const [isPending,  startTrans]  = useTransition();

  // ── Filters ──
  const [search,        setSearch]       = useState("");
  const [filterStatus,  setFilterStatus] = useState(""); // "" = all
  const [filterCat,     setFilterCat]    = useState(""); // "" = all
  const [filterOpen,    setFilterOpen]   = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    if (!filterOpen) return;
    const handler = (e) => { if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [filterOpen]);

  function onFormDone() { setEditing(null); setShowAdd(false); window.location.reload(); }

  function handleDelete(roomId) {
    setError("");
    startTrans(async () => {
      try {
        await deleteRoom(roomId);
        setRooms((prev) => prev.filter((r) => r._id !== roomId));
      } catch (err) {
        setError(err.message || "Delete failed.");
      } finally { setConfirm(null); }
    });
  }

  function handleStatusChange(roomId, status) {
    startTrans(async () => {
      try {
        await updateRoomStatus(roomId, status);
        setRooms((prev) => prev.map((r) => r._id === roomId ? { ...r, status } : r));
      } catch (err) { setError(err.message || "Status update failed."); }
    });
  }

  const catName = (catId) => {
    const id = idStr(catId);
    return categories.find((c) => String(c._id) === id)?.name ?? "–";
  };

  // ── Filter rooms ──────────────────────────────────────────────────────────
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (filterStatus && r.status !== filterStatus) return false;
      if (filterCat && idStr(r.category) !== filterCat) return false;
      if (search) {
        const q = search.toLowerCase();
        const numMatch = String(r.roomNumber).toLowerCase().includes(q);
        const catMatch = catName(r.category).toLowerCase().includes(q);
        if (!numMatch && !catMatch) return false;
      }
      return true;
    });
  }, [rooms, filterStatus, filterCat, search]);

  // ── Status counts ─────────────────────────────────────────────────────────
  const statusCounts = useMemo(() => {
    const counts = { available: 0, occupied: 0, maintenance: 0, blocked: 0 };
    rooms.forEach((r) => { if (counts[r.status] !== undefined) counts[r.status]++; });
    return counts;
  }, [rooms]);

  // ── Group filtered rooms: block → floor ──────────────────────────────────
  const blockOrder    = blocks.length > 0 ? blocks : [""];
  const noBlock       = filteredRooms.filter((r) => !r.block || r.block === "");
  const grouped       = {};
  for (const b of blockOrder) {
    grouped[b] = filteredRooms.filter((r) => (b === "" ? (!r.block || r.block === "") : r.block === b));
  }
  const knownBlockSet = new Set([...blockOrder]);
  const unknownBlocks = [...new Set(filteredRooms.map((r) => r.block).filter((b) => b && !knownBlockSet.has(b)))];
  for (const b of unknownBlocks) grouped[b] = filteredRooms.filter((r) => r.block === b);
  // Always include "" key if there are unblocked rooms (even when property has blocks defined)
  if (noBlock.length > 0 && !knownBlockSet.has("")) grouped[""] = noBlock;
  const allBlockKeys  = [
    ...blockOrder,
    ...unknownBlocks,
    ...(noBlock.length > 0 && !knownBlockSet.has("") ? [""] : []),
  ].filter((b) => (grouped[b]?.length ?? 0) > 0);

  // ── No categories guard ───────────────────────────────────────────────────
  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-white/3 border border-white/6 flex items-center justify-center">
          <svg viewBox="0 0 18 18" width="17" height="17" fill="none" className="text-white/20">
            <rect x="1.5" y="1.5" width="6.5" height="6.5" rx="1.3" stroke="currentColor" strokeWidth="1.2"/>
            <rect x="10" y="1.5" width="6.5" height="6.5" rx="1.3" stroke="currentColor" strokeWidth="1.2"/>
            <rect x="1.5" y="10" width="6.5" height="6.5" rx="1.3" stroke="currentColor" strokeWidth="1.2"/>
            <rect x="10" y="10" width="6.5" height="6.5" rx="1.3" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
        </div>
        <div>
          <p className="text-[13px] text-white/40 font-medium">No categories yet</p>
          <p className="text-[11.5px] text-white/20 mt-0.5">Create at least one category before adding rooms.</p>
        </div>
        {onNeedCategories && (
          <button onClick={onNeedCategories}
            className="px-5 py-2 rounded-xl bg-white/5 border border-white/8 text-[11.5px]
              text-white/50 hover:text-white hover:bg-white/8 transition-all duration-200">
            Go to Categories →
          </button>
        )}
      </div>
    );
  }

  const hasFilters = !!(search || filterStatus || filterCat);

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-[11.5px] text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">
          {error}
        </p>
      )}

      {/* ── Status summary chips ── */}
      {rooms.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {ROOM_STATUSES.map((s) => {
            const ss = STATUS_STYLE[s];
            const count = statusCounts[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => setFilterStatus((prev) => prev === s ? "" : s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px]
                  uppercase tracking-[0.13em] font-semibold transition-all duration-200
                  ${filterStatus === s
                    ? `${ss.text} ${ss.bg} ${ss.border}`
                    : "border-white/8 text-white/30 hover:border-white/15 hover:text-white/55"
                  }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${ss.dot}`} />
                {s} <span className="opacity-60">({count})</span>
              </button>
            );
          })}
          <span className="text-[10px] text-white/20 self-center ml-1">
            {rooms.length} total
          </span>
        </div>
      )}

      {/* ── Search + filter toolbar ── */}
      {rooms.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-45 relative flex items-center">
            <div className="absolute left-3 pointer-events-none">
              <SearchIcon />
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by room number or category…"
              className="w-full bg-white/3 border border-white/7 rounded-xl pl-9 pr-3.5 py-2.5
                text-[12px] text-white placeholder-white/20 focus:outline-none
                focus:border-[#7A2267]/50 transition-all duration-200"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 text-white/25 hover:text-white/50 transition-colors"
              >
                <svg viewBox="0 0 10 10" width="9" height="9" fill="none">
                  <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>

          {/* Category filter */}
          {categories.length > 1 && (
            <div className="w-48">
              <CustomSelect
                value={filterCat}
                onChange={setFilterCat}
                options={[
                  { value: "", label: "All Categories" },
                  ...categories.map((c) => ({ value: String(c._id), label: c.name })),
                ]}
              />
            </div>
          )}

          {/* Clear filters */}
          {hasFilters && (
            <button
              onClick={() => { setSearch(""); setFilterStatus(""); setFilterCat(""); }}
              className="px-3 py-2.5 rounded-xl text-[11px] text-white/30 hover:text-white/55
                border border-white/7 hover:border-white/15 transition-all duration-200"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* ── Room list ── */}
      {rooms.length === 0 && !showAdd ? (
        <div className="text-center py-14 border border-dashed border-white/6 rounded-2xl">
          <p className="text-[13px] text-white/25">No rooms yet.</p>
          <p className="text-[11.5px] text-white/15 mt-1">Click "Add Room" below to get started.</p>
        </div>
      ) : filteredRooms.length === 0 && hasFilters ? (
        <div className="text-center py-10 border border-white/6 rounded-2xl">
          <p className="text-[13px] text-white/25">No rooms match your filters.</p>
          <button
            onClick={() => { setSearch(""); setFilterStatus(""); setFilterCat(""); }}
            className="mt-3 text-[11px] text-[#c05aae]/60 hover:text-[#c05aae] transition-colors"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {allBlockKeys.map((blockKey) => {
            const blockRooms = grouped[blockKey] ?? [];
            if (!blockRooms.length) return null;
            const floors = [...new Set(blockRooms.map((r) => r.floor))].sort((a, b) => a - b);

            return (
              <div key={blockKey} className="border border-white/6 rounded-2xl overflow-hidden">
                {/* Block header */}
                {(blocks.length > 0 || unknownBlocks.length > 0) && (
                  <div className="px-4 py-3 bg-white/2 border-b border-white/5 flex items-center gap-2">
                    <svg viewBox="0 0 14 14" width="11" height="11" fill="none" className="text-[#7A2267]/50">
                      <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M4 7h6M4 4.5h6M4 9.5h3.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                    </svg>
                    <span className="text-[10.5px] uppercase tracking-[0.18em] text-white/45 font-bold">
                      {blockKey || "No Block"}
                    </span>
                    <span className="text-[9.5px] text-white/20">
                      ({blockRooms.length} room{blockRooms.length !== 1 ? "s" : ""})
                    </span>
                  </div>
                )}

                {floors.map((floor) => {
                  const floorRooms = blockRooms.filter((r) => r.floor === floor);
                  return (
                    <div key={floor}>
                      <div className="px-4 py-2 border-b border-white/4 flex items-center gap-2">
                        <span className="text-[9.5px] uppercase tracking-wider text-white/22 font-semibold">
                          Floor {floor}
                        </span>
                        <span className="text-[9px] text-white/15">
                          · {floorRooms.length} room{floorRooms.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <table className="w-full">
                        <tbody>
                          {floorRooms.map((room, ri) => (
                            <tr
                              key={String(room._id)}
                              className={`transition-colors
                                ${ri < floorRooms.length - 1 ? "border-b border-white/4" : ""}
                                ${editingId === String(room._id) ? "bg-white/2" : "hover:bg-white/1.5"}`}
                            >
                              {editingId === String(room._id) ? (
                                <td colSpan={4} className="px-4 py-4">
                                  <p className="text-[10px] uppercase tracking-wider text-[#c05aae]/60
                                    font-semibold mb-3">
                                    Editing Room {room.roomNumber}
                                  </p>
                                  <RoomForm
                                    propertyId={propertyId}
                                    categories={categories}
                                    blocks={blocks}
                                    room={room}
                                    onDone={onFormDone}
                                  />
                                </td>
                              ) : (
                                <>
                                  {/* Room number */}
                                  <td className="px-4 py-3 w-28">
                                    <div className="flex items-center gap-2.5">
                                      {room.coverImage ? (
                                        <img src={room.coverImage} alt=""
                                          className="w-8 h-8 rounded-lg object-cover opacity-70 shrink-0"/>
                                      ) : (
                                        <div className="w-8 h-8 rounded-lg bg-white/4 border border-white/6
                                          flex items-center justify-center shrink-0">
                                          <svg viewBox="0 0 14 14" width="11" height="11" fill="none"
                                            className="text-white/15">
                                            <rect x="1" y="3" width="12" height="9" rx="1.3"
                                              stroke="currentColor" strokeWidth="1.2"/>
                                            <path d="M1 6.5h12" stroke="currentColor" strokeWidth="1.1"/>
                                          </svg>
                                        </div>
                                      )}
                                      <span className="text-[13px] font-mono font-semibold text-white/80">
                                        {room.roomNumber}
                                      </span>
                                    </div>
                                  </td>

                                  {/* Category */}
                                  <td className="px-3 py-3 text-[11.5px] text-white/35 max-w-37.5">
                                    <span className="truncate block">{catName(room.category)}</span>
                                  </td>

                                  {/* Status */}
                                  <td className="px-3 py-3">
                                    <StatusPill
                                      roomId={String(room._id)}
                                      status={room.status}
                                      onStatusChange={handleStatusChange}
                                      isPending={isPending}
                                    />
                                  </td>

                                  {/* Actions — always visible */}
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        onClick={() => setEditing(String(room._id))}
                                        className="px-3 py-1.5 rounded-lg text-[10.5px] font-medium
                                          text-white/40 hover:text-white/80 bg-white/3 hover:bg-white/7
                                          border border-white/6 hover:border-white/12
                                          transition-all duration-200"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => setConfirm(String(room._id))}
                                        className="px-3 py-1.5 rounded-lg text-[10.5px] font-medium
                                          text-red-400/40 hover:text-red-400 bg-transparent
                                          hover:bg-red-500/8 border border-transparent
                                          hover:border-red-500/20 transition-all duration-200"
                                      >
                                        Del
                                      </button>
                                    </div>
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add room ── */}
      {showAdd ? (
        <div className="bg-white/2 border border-[#7A2267]/20 rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-wider text-[#c05aae]/60 font-semibold mb-1">New Room</p>
          <RoomForm
            propertyId={propertyId}
            categories={categories}
            blocks={blocks}
            onDone={onFormDone}
          />
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full py-3.5 rounded-xl border border-dashed border-white/8 text-[12px]
            text-white/25 hover:text-white/55 hover:border-white/18 hover:bg-white/1.5
            transition-all duration-200 flex items-center justify-center gap-2"
        >
          <svg viewBox="0 0 12 12" width="11" height="11" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          Add Room
        </button>
      )}

      {/* ── Delete confirm modal ── */}
      {confirmDel && (
        <div className="fixed inset-0 z-300 flex items-center justify-center p-4
          bg-black/75 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/8 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <p className="text-[14px] font-semibold text-white/85">Delete this room?</p>
            <p className="text-[12px] text-white/35 leading-relaxed">
              This will permanently remove the room. This cannot be undone.
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => handleDelete(confirmDel)}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[12.5px]
                  font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {isPending ? "Deleting…" : "Delete"}
              </button>
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/8 text-white/40
                  text-[12.5px] hover:text-white/65 hover:border-white/15 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
