"use client";

import { useState, useTransition, useMemo, useRef, useEffect } from "react";
import PageHeader from "@/components/admin/PageHeader";
import {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
} from "@/actions/dining/diningActions";

const VENUE_TABS = [
  { key: "cafe",       label: "Amber Café",       icon: "☕" },
  { key: "restaurant", label: "Amber Restaurant",  icon: "🍽" },
];

const BLANK_FORM = {
  name: "", category: "", description: "", price: "",
  isPopular: false, isAvailable: true,
};

/* ─── Toggle Switch ─────────────────────────────────────────── */
function ToggleSwitch({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none group">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-[22px] rounded-full transition-all duration-200 cursor-pointer flex-shrink-0
          ${checked ? "bg-[#7A2267]" : "bg-white/[0.08] border border-white/[0.08]"}`}
      >
        <span className={`absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow-sm
          transition-transform duration-200 ${checked ? "translate-x-[18px]" : "translate-x-0"}`} />
      </div>
      <span className={`text-[11.5px] transition-colors duration-200 ${checked ? "text-white/70" : "text-white/35"}`}>
        {label}
      </span>
    </label>
  );
}

/* ─── Category Select ──────────────────────────────────────── */
function CategorySelect({ value, onChange, categories }) {
  const [open, setOpen]     = useState(false);
  const [newCat, setNewCat] = useState("");
  const ref                 = useRef(null);
  const inputRef            = useRef(null);

  useEffect(() => {
    function onMouseDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  function selectCat(cat) {
    onChange(cat);
    setOpen(false);
    setNewCat("");
  }

  function addNew() {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setNewCat("");
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl
          bg-white/[0.04] border text-[13px] transition-all duration-200 text-left
          ${open
            ? "border-[#7A2267]/50 bg-white/[0.06]"
            : "border-white/[0.08] hover:border-white/[0.15]"
          }`}
      >
        <span className={value ? "text-white/80" : "text-white/20"}>
          {value || "Select or add category…"}
        </span>
        <svg
          viewBox="0 0 10 6" width="10" height="6" fill="none"
          className={`text-white/30 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-[300]
          bg-[#141414] border border-white/[0.10] rounded-xl shadow-2xl overflow-hidden">

          {/* Existing categories list */}
          {categories.length > 0 ? (
            <div className="p-1.5 max-h-[180px] overflow-y-auto
              [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => selectCat(cat)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[12.5px] transition-all duration-150
                    flex items-center justify-between gap-2
                    ${value === cat
                      ? "bg-[#7A2267]/20 text-[#c05aae]"
                      : "text-white/55 hover:bg-white/[0.05] hover:text-white/85"
                    }`}
                >
                  {cat}
                  {value === cat && (
                    <svg viewBox="0 0 12 12" width="11" height="11" fill="none" className="flex-shrink-0">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p className="px-4 py-3 text-[11px] text-white/20 italic">No categories yet — add one below</p>
          )}

          {/* Divider */}
          <div className="border-t border-white/[0.07] mx-1" />

          {/* Add new section */}
          <div className="p-2.5">
            <p className="text-[9px] uppercase tracking-[0.18em] text-white/25 font-semibold mb-2 px-1">
              New Category
            </p>
            <div className="flex gap-1.5">
              <input
                ref={inputRef}
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addNew(); }
                  if (e.key === "Escape") setOpen(false);
                }}
                placeholder="Type name and press Enter…"
                className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08]
                  text-[12px] text-white/75 placeholder-white/20 outline-none
                  focus:border-[#7A2267]/40 transition-colors duration-200"
              />
              <button
                type="button"
                onClick={addNew}
                disabled={!newCat.trim()}
                className="px-3.5 py-2 rounded-lg bg-[#7A2267] hover:bg-[#8a256f] text-white
                  text-[11.5px] font-semibold transition-colors duration-200
                  disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Stat Card ─────────────────────────────────────────────── */
function StatCard({ label, value, sub, accent }) {
  return (
    <div className="flex-1 min-w-0 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/25 font-semibold mb-1">{label}</p>
      <p className={`text-[22px] font-semibold leading-none ${accent || "text-white/80"}`}>{value}</p>
      {sub && <p className="text-[10px] text-white/25 mt-1">{sub}</p>}
    </div>
  );
}

/* ─── Item Row ──────────────────────────────────────────────── */
function ItemRow({ item, onEdit, onDelete, onToggleAvail, isPending }) {
  return (
    <div className={`group flex items-start sm:items-center gap-3 p-3.5 rounded-xl border
      transition-all duration-200 cursor-default
      ${item.isAvailable
        ? "border-white/[0.06] bg-white/[0.015] hover:border-white/[0.1] hover:bg-white/[0.03]"
        : "border-white/[0.03] bg-transparent opacity-40 hover:opacity-60"
      }`}>

      {/* Left — info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-[12.5px] font-semibold text-white/85 leading-snug">{item.name}</p>
          {item.isPopular && (
            <span className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-full
              bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/20 font-semibold leading-none">
              Popular
            </span>
          )}
        </div>
        {item.description && (
          <p className="text-[10.5px] text-white/25 mt-0.5 leading-snug line-clamp-1">{item.description}</p>
        )}
        <p className="text-[11px] text-white/35 mt-0.5 font-medium">৳{item.price}</p>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Availability toggle */}
        <button
          disabled={isPending}
          onClick={() => onToggleAvail(item._id, !item.isAvailable)}
          title={item.isAvailable ? "Mark unavailable" : "Mark available"}
          className={`px-2.5 py-1 rounded-lg text-[9px] uppercase tracking-wider font-semibold
            transition-all duration-200 border whitespace-nowrap
            ${item.isAvailable
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
              : "bg-white/[0.04] text-white/20 border-white/[0.08] hover:bg-white/[0.08] hover:text-white/40"
            }`}
        >
          {item.isAvailable ? "Live" : "Off"}
        </button>

        {/* Edit */}
        <button
          onClick={() => onEdit(item)}
          title="Edit item"
          className="p-1.5 rounded-lg text-white/25 hover:text-white/70 hover:bg-white/[0.05]
            transition-all duration-200 opacity-0 group-hover:opacity-100 sm:opacity-100"
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
          title="Delete item"
          className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10
            transition-all duration-200 opacity-0 group-hover:opacity-100 sm:opacity-100"
        >
          <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
            <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" stroke="currentColor"
              strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ─── Form Drawer ───────────────────────────────────────────── */
function FormDrawer({ open, editing, form, onField, onSubmit, onClose, isPending, venueLabel, existingCategories }) {
  if (!open) return null;
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel — full-screen on mobile, side drawer on desktop */}
      <div className="fixed inset-x-0 bottom-0 z-[210] sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[420px]
        bg-[#101010] border-t border-white/[0.08] sm:border-t-0 sm:border-l
        rounded-t-3xl sm:rounded-none flex flex-col shadow-2xl
        animate-in slide-in-from-bottom sm:slide-in-from-right duration-300">

        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-white/10" />
        </div>

        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-[14px] font-semibold text-white/85">
              {editing ? "Edit Item" : "Add New Item"}
            </h2>
            <p className="text-[11px] text-white/30 mt-0.5">{venueLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/30 hover:text-white/70 hover:bg-white/[0.05]
              transition-all duration-200"
          >
            <svg viewBox="0 0 14 14" width="14" height="14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Drawer body — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <form id="menu-form" onSubmit={onSubmit} className="flex flex-col gap-4">

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-wider text-white/30">Item Name *</label>
              <input
                value={form.name}
                onChange={(e) => onField("name", e.target.value)}
                required
                placeholder="e.g. Chicken Biryani"
                className="px-3.5 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08]
                  text-[13px] text-white/80 placeholder-white/20 outline-none
                  focus:border-[#7A2267]/50 focus:bg-white/[0.06] transition-all duration-200"
              />
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-wider text-white/30">Category *</label>
              <CategorySelect
                value={form.category}
                onChange={(v) => onField("category", v)}
                categories={existingCategories}
              />
              {!form.category && (
                <p className="text-[10px] text-white/20">Select from list or type a new category name</p>
              )}
            </div>

            {/* Price */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-wider text-white/30">Price (৳) *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-white/30 font-medium select-none">
                  ৳
                </span>
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => onField("price", e.target.value)}
                  required
                  placeholder="350"
                  className="w-full pl-8 pr-3.5 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08]
                    text-[13px] text-white/80 placeholder-white/20 outline-none
                    focus:border-[#7A2267]/50 focus:bg-white/[0.06] transition-all duration-200"
                />
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-wider text-white/30">
                Description
                <span className="normal-case tracking-normal text-white/20 ml-1">(optional)</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => onField("description", e.target.value)}
                placeholder="Short description…"
                rows={2}
                className="px-3.5 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08]
                  text-[13px] text-white/80 placeholder-white/20 outline-none resize-none
                  focus:border-[#7A2267]/50 focus:bg-white/[0.06] transition-all duration-200"
              />
            </div>

            {/* Toggles */}
            <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.01] flex flex-col gap-3.5">
              <p className="text-[10px] uppercase tracking-wider text-white/20 font-semibold">Options</p>
              <ToggleSwitch checked={form.isPopular}   onChange={(v) => onField("isPopular", v)}   label="Popular / Chef's Pick" />
              <ToggleSwitch checked={form.isAvailable} onChange={(v) => onField("isAvailable", v)} label="Available (Live on menu)" />
            </div>

          </form>
        </div>

        {/* Drawer footer */}
        <div className="px-5 py-4 border-t border-white/[0.06] flex gap-2.5 bg-[#0d0d0d]">
          <button
            form="menu-form"
            type="submit"
            disabled={isPending}
            className="flex-1 py-3 rounded-xl bg-[#7A2267] text-white text-[12px] font-semibold
              hover:bg-[#8a256f] disabled:opacity-50 transition-colors duration-200"
          >
            {isPending ? "Saving…" : editing ? "Save Changes" : "Add Item"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 rounded-xl border border-white/[0.08] text-white/40
              text-[12px] font-semibold hover:text-white/70 hover:border-white/[0.15]
              transition-all duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Main Component ────────────────────────────────────────── */
export default function MenuManager({ initialItems = [] }) {
  const [activeVenue, setActiveVenue] = useState("cafe");
  const [items, setItems]             = useState(initialItems);
  const [editing, setEditing]         = useState(null);
  const [form, setForm]               = useState(BLANK_FORM);
  const [showForm, setShowForm]       = useState(false);
  const [search, setSearch]           = useState("");
  const [isPending, startTransition]  = useTransition();
  const [toast, setToast]             = useState(null);

  const venueItems   = items.filter((i) => i.venue === activeVenue);
  const venueLabel   = VENUE_TABS.find((t) => t.key === activeVenue)?.label ?? "";

  const existingCategories = useMemo(
    () => [...new Set(venueItems.map((i) => i.category))].sort(),
    [venueItems]
  );

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return venueItems;
    return venueItems.filter(
      (i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
    );
  }, [venueItems, search]);

  const grouped = useMemo(() =>
    filteredItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {}),
  [filteredItems]);

  /* Stats */
  const totalItems     = venueItems.length;
  const availableCount = venueItems.filter((i) => i.isAvailable).length;
  const categoryCount  = existingCategories.length;

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
      name:        item.name,
      category:    item.category,
      description: item.description || "",
      price:       String(item.price),
      isPopular:   item.isPopular,
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

    const payload = { ...form, price: Number(form.price), venue: activeVenue };

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

  return (
    <div className="p-5 sm:p-6 lg:p-8 space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[999] px-4 py-2.5 rounded-xl text-[12px] font-medium
          shadow-xl transition-all duration-300 pointer-events-none
          ${toast.type === "ok"
            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
            : "bg-red-500/20 text-red-300 border border-red-500/30"
          }`}>
          {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Menu Manager"
        subtitle="Manage café & restaurant menus"
        count={`${totalItems} items`}
        action={
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7A2267] text-white
              text-[11.5px] font-semibold hover:bg-[#8a256f] transition-colors duration-200"
          >
            <svg viewBox="0 0 14 14" width="11" height="11" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Add Item
          </button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total Items"  value={totalItems}     sub={venueLabel} />
        <StatCard label="Live"         value={availableCount} sub="available now" accent="text-emerald-400" />
        <StatCard label="Categories"   value={categoryCount}  sub="sections" />
      </div>

      {/* Venue tabs + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Tabs */}
        <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 w-fit flex-shrink-0">
          {VENUE_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveVenue(tab.key); setSearch(""); }}
              className={`px-4 py-2 rounded-lg text-[11.5px] font-semibold transition-all duration-200
                flex items-center gap-1.5
                ${activeVenue === tab.key
                  ? "bg-[#7A2267] text-white shadow-sm"
                  : "text-white/40 hover:text-white/70"
                }`}
            >
              <span className="text-[13px] leading-none">{tab.icon}</span>
              <span className="hidden xs:inline">{tab.label}</span>
              <span className="inline xs:hidden">{tab.label.split(" ")[1]}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none"
            viewBox="0 0 16 16" width="13" height="13" fill="none">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${venueLabel}…`}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07]
              text-[12.5px] text-white/75 placeholder-white/20 outline-none
              focus:border-white/[0.13] focus:bg-white/[0.05] transition-all duration-200"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60
                transition-colors duration-150"
            >
              <svg viewBox="0 0 14 14" width="11" height="11" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Items list */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center
            justify-center mb-4 text-2xl">
            {search ? "🔍" : VENUE_TABS.find((t) => t.key === activeVenue)?.icon}
          </div>
          <p className="text-[13px] text-white/30 font-medium">
            {search ? `No items matching "${search}"` : `No items yet for ${venueLabel}`}
          </p>
          {!search && (
            <button
              onClick={openAdd}
              className="mt-3 text-[11.5px] text-[#c9a96e] hover:text-[#d4b87a] transition-colors"
            >
              Add your first item →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-7">
          {Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat}>
              {/* Category header */}
              <div className="flex items-center gap-3 mb-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-semibold flex-shrink-0">
                  {cat}
                </p>
                <div className="h-px flex-1 bg-white/[0.05]" />
                <span className="flex-shrink-0 inline-flex items-center text-[9.5px] font-medium text-white/25
                  bg-white/[0.04] border border-white/[0.07] rounded-full px-2 py-0.5 leading-none">
                  {catItems.length}
                </span>
              </div>

              {/* Items */}
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

      {/* Form Drawer */}
      <FormDrawer
        open={showForm}
        editing={editing}
        form={form}
        onField={handleField}
        onSubmit={handleSubmit}
        onClose={closeForm}
        isPending={isPending}
        venueLabel={venueLabel}
        existingCategories={existingCategories}
      />
    </div>
  );
}
