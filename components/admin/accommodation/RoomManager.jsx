"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createRoom, updateRoom, deleteRoom, updateRoomStatus } from "@/actions/accommodation/roomActions";
import ImageUpload from "@/components/ui/ImageUpload";
import MultiImageUpload from "@/components/ui/MultiImageUpload";

const ROOM_STATUSES = ["available", "occupied", "maintenance", "blocked"];
const STATUS_COLOR = {
  available:   "text-emerald-400 bg-emerald-400/10 border-emerald-400/25",
  occupied:    "text-amber-400 bg-amber-400/10 border-amber-400/25",
  maintenance: "text-orange-400 bg-orange-400/10 border-orange-400/25",
  blocked:     "text-red-400 bg-red-400/10 border-red-400/25",
};

const INPUT = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-[12.5px] text-white placeholder-white/20 focus:outline-none focus:border-[#7A2267]/60 transition-all duration-200";
const LABEL = "block text-[10px] uppercase tracking-wider text-white/35 font-semibold mb-1.5";

function RoomForm({ propertyId, categories, blocks = [], room = null, onDone }) {
  const isEdit = !!room;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [showImages, setShowImages] = useState(false);

  const initCatId = room?.category?._id ?? room?.category ?? (categories[0]?._id ?? "");
  const initCat   = categories.find((c) => c._id === initCatId || c._id === (typeof initCatId === "object" ? initCatId?._id : initCatId));

  const [selectedCat, setSelectedCat] = useState(initCat ?? null);
  const [variants, setVariants] = useState(initCat?.variants ?? []);

  // If property has blocks and this is a new room, default to first block
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
    variantId:        room?.variantId        ?? "",
    // Price overrides (0 = inherit from variant/category)
    pricePerNight:    room?.pricePerNight    ?? 0,
    pricePerDay:      room?.pricePerDay      ?? 0,
    // Day long: null=inherit, true=yes, false=no
    dayLongSupported: room?.dayLongSupported ?? null,
  });

  const set = (key) => (e) => {
    const val = e.target.value;
    setForm((f) => {
      const updated = { ...f, [key]: val };
      if (key === "category") {
        const cat = categories.find((c) => c._id === val);
        const newVariants = cat?.variants ?? [];
        setSelectedCat(cat ?? null);
        setVariants(newVariants);
        if (!newVariants.find((v) => v._id === f.variantId)) {
          updated.variantId = "";
        }
      }
      return updated;
    });
  };

  // The effective day-long state for this room
  const catSupportsDayLong = selectedCat?.supportsDayLong ?? false;
  const roomDayLongEffective =
    form.dayLongSupported === null ? catSupportsDayLong
    : form.dayLongSupported;

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    // Block is required when property defines blocks
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
        if (isEdit) {
          await updateRoom(room._id, data);
        } else {
          await createRoom(data);
        }
        onDone();
      } catch (err) {
        setError(err.message || "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-3">
      {error && (
        <p className="text-[11.5px] text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      {/* Core fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Category *</label>
          <select className={INPUT} value={form.category} onChange={set("category")} required>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}{c.block ? ` (${c.block})` : ""}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL}>Room Number *</label>
          <input className={INPUT} value={form.roomNumber} onChange={set("roomNumber")} placeholder="e.g. 301" required />
        </div>
        <div>
          <label className={LABEL}>Floor</label>
          <input type="number" className={INPUT} value={form.floor} onChange={set("floor")} min="1" />
        </div>
        <div>
          <label className={LABEL}>
            Block / Wing{blocks.length > 0 && <span className="text-red-400 ml-1">*</span>}
          </label>
          {blocks.length > 0 ? (
            <select className={INPUT} value={form.block} onChange={set("block")} required>
              {blocks.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          ) : (
            <input className={INPUT} value={form.block} onChange={set("block")} placeholder="e.g. Block A (optional)" />
          )}
          {blocks.length > 0 && (
            <p className="text-[9.5px] text-amber-400/80 mt-1">Required — this property has multiple blocks.</p>
          )}
        </div>
        <div>
          <label className={LABEL}>Status</label>
          <select className={INPUT} value={form.status} onChange={set("status")}>
            {ROOM_STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">{s}</option>
            ))}
          </select>
        </div>
        {variants.length > 0 && (
          <div className="col-span-2">
            <label className={LABEL}>Room Variant</label>
            <select className={INPUT} value={form.variantId} onChange={set("variantId")}>
              <option value="">— No specific variant —</option>
              {variants.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.name} · ৳{v.pricePerNight}/night{v.pricePerDay > 0 ? ` · ৳${v.pricePerDay}/day` : ""} · {v.bedType}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ── Day Long Support ── */}
        <div className="col-span-2 bg-[#7A2267]/8 border border-[#7A2267]/20 rounded-xl p-4 space-y-3">
          <p className="text-[10px] uppercase tracking-wider text-[#c05aae]/60 font-semibold">Day Long Support</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: null,  label: "Inherit",       sub: catSupportsDayLong ? "Category: enabled" : "Category: disabled" },
              { val: true,  label: "Force Enable",  sub: "This room only" },
              { val: false, label: "Force Disable", sub: "This room only" },
            ].map(({ val, label, sub }) => (
              <button key={String(val)} type="button"
                onClick={() => setForm((f) => ({ ...f, dayLongSupported: val }))}
                className={`text-left px-3 py-2.5 rounded-xl border-2 transition-all duration-150
                  ${form.dayLongSupported === val
                    ? "border-[#7A2267] bg-[#7A2267]/15"
                    : "border-white/[0.07] hover:border-[#7A2267]/30"}`}>
                <p className="text-[11.5px] font-semibold text-white/65">{label}</p>
                <p className="text-[9.5px] text-white/25 mt-0.5">{sub}</p>
              </button>
            ))}
          </div>
          {roomDayLongEffective && (
            <div className="pt-2 border-t border-[#7A2267]/20">
              <label className={LABEL}>Day Long Price / Day (BDT) <span className="text-white/20 normal-case">(0 = inherit from variant / category)</span></label>
              <input type="number" className={INPUT} value={form.pricePerDay}
                onChange={(e) => setForm((f) => ({ ...f, pricePerDay: e.target.value }))} min="0" />
            </div>
          )}
          {form.dayLongSupported === true && !catSupportsDayLong && (
            <p className="text-[10px] text-amber-400/70">
              ⚠ Category does not support day long — this room-level override applies only to this room.
            </p>
          )}
        </div>

        {/* ── Price Overrides ── */}
        <div className="col-span-2 border border-white/[0.07] rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-3">
            Night Price Override <span className="normal-case text-white/20 ml-1">(0 = inherit from variant / category)</span>
          </p>
          <div>
            <label className={LABEL}>Price / Night (BDT)</label>
            <input type="number" className={INPUT} value={form.pricePerNight}
              onChange={(e) => setForm((f) => ({ ...f, pricePerNight: e.target.value }))} min="0" />
          </div>
        </div>

        <div className="col-span-2">
          <label className={LABEL}>Description</label>
          <textarea
            className={`${INPUT} resize-none`}
            rows={2}
            value={form.description}
            onChange={set("description")}
            placeholder="Short room description (optional)"
          />
        </div>
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
          className="w-full flex items-center justify-between px-4 py-3
            text-left text-[11.5px] font-medium text-white/50 hover:text-white/75
            hover:bg-white/2 transition-all duration-200"
        >
          <span>Images</span>
          <motion.svg
            animate={{ rotate: showImages ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            viewBox="0 0 10 6" width="9" height="9" fill="none"
          >
            <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
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
              <div className="px-4 pb-4 space-y-4 border-t border-white/6">
                <div className="pt-3">
                  <label className={LABEL}>Cover Image</label>
                  <ImageUpload
                    dark
                    value={form.coverImage}
                    onChange={(url) => setForm((f) => ({ ...f, coverImage: url }))}
                  />
                </div>
                <div>
                  <label className={LABEL}>Gallery Images</label>
                  <MultiImageUpload
                    dark
                    values={form.images}
                    onChange={(urls) => setForm((f) => ({ ...f, images: urls }))}
                  />
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
          {isPending ? "Saving…" : isEdit ? "Save" : "Add Room"}
        </button>
        <button type="button" onClick={onDone} className="px-4 py-2 text-[12px] text-white/30 hover:text-white/60 transition-colors duration-200">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function RoomManager({ propertyId, categories, blocks = [], initialRooms = [], onNeedCategories }) {
  const [rooms, setRooms]         = useState(initialRooms);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAdd] = useState(false);
  const [deletingId, setDelId]    = useState(null);
  const [error, setError]         = useState("");
  const [isPending, startTrans]   = useTransition();

  function onFormDone() {
    setEditingId(null);
    setShowAdd(false);
    window.location.reload();
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

  const catName = (catId) => {
    const id = typeof catId === "object" ? catId?._id : catId;
    return categories.find((c) => c._id === id)?.name ?? "–";
  };

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-[11.5px] text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      {/* Guard: need at least one category before rooms can be created */}
      {categories.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <div className="w-11 h-11 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center">
            <svg viewBox="0 0 18 18" width="17" height="17" fill="none" className="text-white/25">
              <rect x="1.5" y="3" width="15" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M6 3V1M12 3V1M1.5 7h15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] text-white/40 font-medium">No room categories yet</p>
            <p className="text-[11.5px] text-white/20 mt-0.5">Add at least one category before creating rooms.</p>
          </div>
          {onNeedCategories && (
            <button
              onClick={onNeedCategories}
              className="mt-1 px-5 py-2 rounded-xl bg-white/6 border border-white/10 text-[11.5px]
                text-white/55 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              Go to Categories →
            </button>
          )}
        </div>
      )}

      {categories.length > 0 && rooms.length === 0 && !showAddForm && (
        <div className="text-center py-12 text-white/20 text-[13px]">
          No rooms yet. Add rooms below.
        </div>
      )}

      {rooms.length > 0 && (() => {
        // Group rooms: block → floor → rooms
        const blockOrder = blocks.length > 0 ? blocks : [""];
        const noBlock    = rooms.filter((r) => !r.block || r.block === "");
        const grouped    = {};
        for (const b of blockOrder) {
          grouped[b] = rooms.filter((r) => (b === "" ? (!r.block || r.block === "") : r.block === b));
        }
        // Any rooms with a block not in the defined list
        const unknownBlocks = [...new Set(rooms.map((r) => r.block).filter((b) => b && !blockOrder.includes(b)))];
        for (const b of unknownBlocks) {
          grouped[b] = rooms.filter((r) => r.block === b);
        }
        const allBlockKeys = [...blockOrder, ...unknownBlocks].filter((b) => b === "" ? noBlock.length > 0 : grouped[b]?.length > 0);

        return (
          <div className="space-y-4">
            {allBlockKeys.map((blockKey) => {
              const blockRooms = grouped[blockKey] || [];
              if (!blockRooms.length) return null;

              // Group by floor within block
              const floors = [...new Set(blockRooms.map((r) => r.floor))].sort((a, b) => a - b);

              return (
                <div key={blockKey} className="border border-white/6 rounded-xl overflow-hidden">
                  {/* Block header */}
                  {(blocks.length > 0 || unknownBlocks.length > 0) && (
                    <div className="px-4 py-2.5 bg-white/2 border-b border-white/6 flex items-center gap-2">
                      <svg viewBox="0 0 14 14" width="12" height="12" fill="none" className="text-[#7A2267]/60">
                        <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                        <path d="M4 7h6M4 4h6M4 10h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                      </svg>
                      <span className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-semibold">
                        {blockKey || "No Block"}
                      </span>
                      <span className="text-[9.5px] text-white/20 ml-1">({blockRooms.length} room{blockRooms.length !== 1 ? "s" : ""})</span>
                    </div>
                  )}

                  {floors.map((floor) => {
                    const floorRooms = blockRooms.filter((r) => r.floor === floor);
                    return (
                      <div key={floor}>
                        {/* Floor sub-header */}
                        <div className="px-4 py-2 bg-white/1.5 border-b border-white/4 flex items-center gap-2">
                          <span className="text-[9.5px] uppercase tracking-wider text-white/25 font-semibold">
                            Floor {floor}
                          </span>
                          <span className="text-[9px] text-white/15">· {floorRooms.length} room{floorRooms.length !== 1 ? "s" : ""}</span>
                        </div>
                        <table className="w-full text-[12px]">
                          <tbody>
                            {floorRooms.map((room, ri) => (
                              <tr key={room._id} className={`border-b border-white/4 hover:bg-white/2 transition-colors ${ri === floorRooms.length - 1 ? "border-b-0" : ""}`}>
                                {editingId === room._id ? (
                                  <td colSpan={5} className="px-4 py-3">
                                    <RoomForm propertyId={propertyId} categories={categories} blocks={blocks} room={room} onDone={onFormDone} />
                                  </td>
                                ) : (
                                  <>
                                    <td className="px-4 py-3 w-32.5">
                                      <div className="flex items-center gap-2.5">
                                        {room.coverImage && (
                                          <img src={room.coverImage} alt="" className="w-7 h-7 rounded-lg object-cover opacity-75 shrink-0" />
                                        )}
                                        <span className="text-white/70 font-mono font-medium">{room.roomNumber}</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-white/35 text-[11.5px]">{catName(room.category)}</td>
                                    <td className="px-4 py-3">
                                      <select
                                        value={room.status}
                                        onChange={(e) => handleStatusChange(room._id, e.target.value)}
                                        disabled={isPending}
                                        className={`text-[10.5px] uppercase tracking-wide border rounded-full px-2.5 py-1
                                          bg-transparent font-medium cursor-pointer transition-all duration-200
                                          focus:outline-none disabled:opacity-50
                                          ${STATUS_COLOR[room.status]}`}
                                      >
                                        {ROOM_STATUSES.map((s) => (
                                          <option key={s} value={s} className="bg-[#111] text-white capitalize">{s}</option>
                                        ))}
                                      </select>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => setEditingId(room._id)}
                                          className="text-[10.5px] text-white/30 hover:text-white/65 transition-colors duration-200">
                                          Edit
                                        </button>
                                        <span className="text-white/15">·</span>
                                        <button onClick={() => handleDelete(room._id)}
                                          disabled={isPending && deletingId === room._id}
                                          className="text-[10.5px] text-red-400/40 hover:text-red-400 transition-colors duration-200 disabled:opacity-40">
                                          {deletingId === room._id ? "…" : "Del"}
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
        );
      })()}

      {categories.length > 0 && (
        showAddForm ? (
          <div className="bg-white/2 border border-[#7A2267]/25 rounded-xl p-4">
            <p className="text-[11px] uppercase tracking-wider text-[#c05aae]/60 font-semibold mb-1">New Room</p>
            <RoomForm propertyId={propertyId} categories={categories} blocks={blocks} onDone={onFormDone} />
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full py-3 rounded-xl border border-dashed border-white/10 text-[12px]
              text-white/25 hover:text-white/50 hover:border-white/20 transition-all duration-200"
          >
            + Add Room
          </button>
        )
      )}
    </div>
  );
}
