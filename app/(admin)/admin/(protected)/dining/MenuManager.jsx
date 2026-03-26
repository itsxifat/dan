"use client";

import { useState, useTransition } from "react";
import {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
} from "@/actions/dining/diningActions";

const VENUE_TABS = [
  { key: "cafe",       label: "Amber Café" },
  { key: "restaurant", label: "Amber Restaurant" },
];

const BLANK_FORM = {
  name: "", category: "", description: "", price: "",
  isVeg: false, isPopular: false, isAvailable: true,
};

function ToggleSwitch({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors duration-200 cursor-pointer
          ${checked ? "bg-[#7A2267]" : "bg-white/10"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white
          transition-transform duration-200 ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </div>
      <span className="text-[11px] text-white/50">{label}</span>
    </label>
  );
}

function ItemRow({ item, onEdit, onDelete, onToggleAvail, isPending }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border
      ${item.isAvailable ? "border-white/[0.06] bg-white/[0.02]" : "border-white/[0.03] bg-transparent opacity-50"}
      transition-all duration-200`}>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[12.5px] font-semibold text-white/85 truncate">{item.name}</p>
          {item.isPopular && (
            <span className="text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full
              bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/20 font-semibold">Popular</span>
          )}
          {item.isVeg && (
            <span className="text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full
              bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">Veg</span>
          )}
        </div>
        <p className="text-[10.5px] text-white/30 mt-0.5">
          {item.category} · ৳{item.price}
        </p>
      </div>

      {/* Available toggle */}
      <button
        disabled={isPending}
        onClick={() => onToggleAvail(item._id, !item.isAvailable)}
        title={item.isAvailable ? "Mark unavailable" : "Mark available"}
        className={`shrink-0 px-2.5 py-1 rounded-lg text-[9.5px] uppercase tracking-wider font-semibold
          transition-colors duration-200 border
          ${item.isAvailable
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
            : "bg-white/5 text-white/25 border-white/10 hover:bg-white/10 hover:text-white/50"
          }`}
      >
        {item.isAvailable ? "Live" : "Hidden"}
      </button>

      {/* Edit */}
      <button
        onClick={() => onEdit(item)}
        className="shrink-0 p-1.5 rounded-lg text-white/30 hover:text-white/70
          hover:bg-white/[0.05] transition-all duration-200"
        title="Edit"
      >
        <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
          <path d="M11 2l3 3-9 9H2v-3l9-9z" stroke="currentColor" strokeWidth="1.3"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Delete */}
      <button
        disabled={isPending}
        onClick={() => onDelete(item._id)}
        className="shrink-0 p-1.5 rounded-lg text-white/20 hover:text-red-400
          hover:bg-red-500/10 transition-all duration-200"
        title="Delete"
      >
        <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
          <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" stroke="currentColor"
            strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}

export default function MenuManager({ initialItems = [] }) {
  const [activeVenue, setActiveVenue]   = useState("cafe");
  const [items, setItems]               = useState(initialItems);
  const [editing, setEditing]           = useState(null);   // item being edited
  const [form, setForm]                 = useState(BLANK_FORM);
  const [showForm, setShowForm]         = useState(false);
  const [isPending, startTransition]    = useTransition();
  const [toast, setToast]               = useState(null);

  const venueItems = items.filter((i) => i.venue === activeVenue);

  function notify(msg, type = "ok") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function openAdd() {
    setEditing(null);
    setForm(BLANK_FORM);
    setShowForm(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({
      name: item.name,
      category: item.category,
      description: item.description || "",
      price: String(item.price),
      isVeg: item.isVeg,
      isPopular: item.isPopular,
      isAvailable: item.isAvailable,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm(BLANK_FORM);
  }

  function handleField(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.category.trim() || !form.price) return;

    const payload = {
      ...form,
      price: Number(form.price),
      venue: activeVenue,
    };

    startTransition(async () => {
      try {
        if (editing) {
          await updateMenuItem(editing._id, payload);
          setItems((prev) => prev.map((i) => i._id === editing._id ? { ...i, ...payload } : i));
          notify("Item updated");
        } else {
          const created = await createMenuItem(payload);
          setItems((prev) => [...prev, created]);
          notify("Item added");
        }
        closeForm();
      } catch {
        notify("Something went wrong", "err");
      }
    });
  }

  function handleDelete(id) {
    if (!confirm("Delete this item?")) return;
    startTransition(async () => {
      try {
        await deleteMenuItem(id);
        setItems((prev) => prev.filter((i) => i._id !== id));
        notify("Item deleted");
      } catch {
        notify("Failed to delete", "err");
      }
    });
  }

  function handleToggleAvail(id, isAvailable) {
    startTransition(async () => {
      try {
        await toggleMenuItemAvailability(id, isAvailable);
        setItems((prev) => prev.map((i) => i._id === id ? { ...i, isAvailable } : i));
      } catch {
        notify("Failed to update", "err");
      }
    });
  }

  // Group items by category for display
  const grouped = venueItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[999] px-4 py-2.5 rounded-xl text-[12px] font-medium
          shadow-xl transition-all duration-300
          ${toast.type === "ok"
            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
            : "bg-red-500/20 text-red-300 border border-red-500/30"
          }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0d0d0d]/95 backdrop-blur-sm border-b border-white/[0.05]
        px-5 sm:px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-semibold text-white/90">Menu Manager</h1>
          <p className="text-[11px] text-white/30 mt-0.5">Manage café & restaurant menus</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7A2267] text-white
            text-[11px] font-semibold uppercase tracking-wide hover:bg-[#8a256f] transition-colors duration-200"
        >
          <svg viewBox="0 0 14 14" width="11" height="11" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          Add Item
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-6">

        {/* Venue tabs */}
        <div className="flex gap-1 mb-6 bg-white/[0.03] rounded-xl p-1 w-fit">
          {VENUE_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveVenue(tab.key)}
              className={`px-5 py-2 rounded-lg text-[11.5px] font-semibold transition-all duration-200
                ${activeVenue === tab.key
                  ? "bg-[#7A2267] text-white shadow-sm"
                  : "text-white/40 hover:text-white/70"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Add/Edit form */}
        {showForm && (
          <div className="mb-6 p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[13px] font-semibold text-white/80">
                {editing ? "Edit Item" : `Add to ${activeVenue === "cafe" ? "Amber Café" : "Amber Restaurant"}`}
              </h2>
              <button onClick={closeForm} className="text-white/30 hover:text-white/70 transition-colors">
                <svg viewBox="0 0 14 14" width="12" height="12" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Name */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider text-white/30">Item Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => handleField("name", e.target.value)}
                  required
                  placeholder="e.g. Chicken Biryani"
                  className="px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08]
                    text-[12.5px] text-white/80 placeholder-white/20 outline-none
                    focus:border-[#7A2267]/50 transition-colors duration-200"
                />
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider text-white/30">Category *</label>
                <input
                  value={form.category}
                  onChange={(e) => handleField("category", e.target.value)}
                  required
                  placeholder="e.g. Main Course, Starters…"
                  list="category-suggestions"
                  className="px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08]
                    text-[12.5px] text-white/80 placeholder-white/20 outline-none
                    focus:border-[#7A2267]/50 transition-colors duration-200"
                />
                <datalist id="category-suggestions">
                  {[...new Set(venueItems.map((i) => i.category))].map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              {/* Price */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider text-white/30">Price (৳) *</label>
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => handleField("price", e.target.value)}
                  required
                  placeholder="e.g. 350"
                  className="px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08]
                    text-[12.5px] text-white/80 placeholder-white/20 outline-none
                    focus:border-[#7A2267]/50 transition-colors duration-200"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider text-white/30">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => handleField("description", e.target.value)}
                  placeholder="Short description…"
                  className="px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08]
                    text-[12.5px] text-white/80 placeholder-white/20 outline-none
                    focus:border-[#7A2267]/50 transition-colors duration-200"
                />
              </div>

              {/* Toggles */}
              <div className="sm:col-span-2 flex flex-wrap gap-5 pt-1">
                <ToggleSwitch checked={form.isVeg}       onChange={(v) => handleField("isVeg", v)}       label="Vegetarian" />
                <ToggleSwitch checked={form.isPopular}   onChange={(v) => handleField("isPopular", v)}   label="Popular / Chef's Pick" />
                <ToggleSwitch checked={form.isAvailable} onChange={(v) => handleField("isAvailable", v)} label="Available (Live)" />
              </div>

              {/* Submit */}
              <div className="sm:col-span-2 flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-[#7A2267] text-white text-[11.5px] font-semibold
                    hover:bg-[#8a256f] disabled:opacity-50 transition-colors duration-200"
                >
                  {isPending ? "Saving…" : editing ? "Save Changes" : "Add Item"}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-5 py-2.5 rounded-xl border border-white/[0.08] text-white/40
                    text-[11.5px] hover:text-white/70 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Items list grouped by category */}
        {venueItems.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[13px] text-white/25">No items yet for this venue.</p>
            <button
              onClick={openAdd}
              className="mt-4 text-[11px] text-[#c9a96e] hover:text-[#d4b87a] transition-colors underline"
            >
              Add your first item
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([cat, catItems]) => (
              <div key={cat}>
                <div className="flex items-center gap-3 mb-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-semibold">{cat}</p>
                  <div className="h-px flex-1 bg-white/[0.05]" />
                  <p className="text-[10px] text-white/20">{catItems.length}</p>
                </div>
                <div className="space-y-2">
                  {catItems.map((item) => (
                    <ItemRow
                      key={item._id}
                      item={item}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                      onToggleAvail={handleToggleAvail}
                      isPending={isPending}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
