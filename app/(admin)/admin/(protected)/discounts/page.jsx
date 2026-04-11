"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import {
  getAdminDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  toggleDiscountActive,
} from "@/actions/discount/discountActions";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtBDT(n) {
  return "৳" + Number(n || 0).toLocaleString();
}
const TODAY     = new Date().toISOString().slice(0, 10);
const NEXT_MONTH = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

const EMPTY = {
  type: "coupon", name: "", description: "", code: "",
  discountType: "percentage", discountValue: "", maxDiscountAmount: "",
  minOrderAmount: "", applicableTo: "all",
  validFrom: TODAY, validTo: NEXT_MONTH,
  usageLimit: "", isPersonal: false, assignedUser: "", image: "", isActive: true,
};

// ─── Custom Dropdown ──────────────────────────────────────────────────────────
function Dropdown({ value, onChange, options, placeholder = "Select…", className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-[12.5px] text-white/80 outline-none hover:border-white/20 transition-all"
      >
        <span className={selected ? "text-white/80" : "text-white/25"}>{selected?.label || placeholder}</span>
        <svg viewBox="0 0 10 6" width="9" height="6" fill="none" className={`shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}>
          <path d="M1 1l4 4 4-4" stroke="#9B8BAB" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full text-left px-3.5 py-2.5 text-[12.5px] transition-colors
                ${o.value === value
                  ? "bg-[#7A2267]/25 text-[#c05aae] font-semibold"
                  : "text-white/60 hover:bg-white/5 hover:text-white/85"}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Mini Date Picker ─────────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function DatePicker({ value, onChange, label }) {
  const [open, setOpen] = useState(false);
  const ref  = useRef(null);
  const now  = value ? new Date(value + "T00:00:00") : new Date();
  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
  function firstDay(y, m)    { return new Date(y, m, 1).getDay(); }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  function selectDay(d) {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    onChange(`${viewYear}-${mm}-${dd}`);
    setOpen(false);
  }

  const totalDays = daysInMonth(viewYear, viewMonth);
  const startDay  = firstDay(viewYear, viewMonth);
  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  const selectedVal = value ? new Date(value + "T00:00:00") : null;
  function isSelected(d) {
    return selectedVal && selectedVal.getFullYear() === viewYear && selectedVal.getMonth() === viewMonth && selectedVal.getDate() === d;
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-[12.5px] text-white/80 outline-none hover:border-white/20 transition-all"
      >
        <span className={value ? "text-white/80" : "text-white/25"}>{value ? fmtDate(value) : `Select ${label}`}</span>
        <svg viewBox="0 0 14 14" width="13" height="13" fill="none" className="shrink-0 text-white/30">
          <rect x="1" y="2.5" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M1 6h12M5 1.5v2M9 1.5v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1.5 left-0 bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl p-3 w-[240px]">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/5 transition-all">
              <svg viewBox="0 0 8 12" width="7" height="11" fill="none"><path d="M6 1L2 6l4 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <span className="text-[12px] font-semibold text-white/80">{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/5 transition-all">
              <svg viewBox="0 0 8 12" width="7" height="11" fill="none"><path d="M2 1l4 5-4 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[9px] uppercase tracking-wide text-white/25 font-semibold py-1">{d}</div>
            ))}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((d, i) => d === null ? (
              <div key={`e${i}`} />
            ) : (
              <button
                key={d}
                type="button"
                onClick={() => selectDay(d)}
                className={`h-7 w-full rounded-lg text-[11px] font-medium transition-all
                  ${isSelected(d) ? "bg-[#7A2267] text-white" : "text-white/55 hover:bg-white/8 hover:text-white/85"}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ value, onChange, label }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-9 h-5 rounded-full transition-all duration-200 ${value ? "bg-[#7A2267]" : "bg-white/10"}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${value ? "left-[18px]" : "left-0.5"}`} />
      </button>
      <span className="text-[12px] text-white/60 font-medium">{label}</span>
    </label>
  );
}

// ─── Segment control ──────────────────────────────────────────────────────────
function Segment({ value, onChange, options }) {
  return (
    <div className="flex gap-1.5">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`flex-1 py-2.5 rounded-xl border text-[12px] font-semibold transition-all
            ${value === v ? "bg-[#7A2267] border-[#7A2267] text-white shadow-[0_2px_12px_rgba(122,34,103,0.3)]" : "bg-white/5 border-white/10 text-white/40 hover:border-white/20 hover:text-white/65"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Type badge ───────────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  return type === "coupon"
    ? <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20">Coupon</span>
    : <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">Auto-Offer</span>;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = "text-white/70" }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl px-5 py-4 flex-1 min-w-0">
      <p className="text-[9px] uppercase tracking-[0.2em] text-white/25 font-semibold mb-1">{label}</p>
      <p className={`text-[22px] font-bold leading-none ${color}`}>{value}</p>
      {sub && <p className="text-[10.5px] text-white/30 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function DiscountModal({ initial, onClose, onSave, isSaving }) {
  const [form, setForm] = useState(initial ? {
    ...EMPTY,
    ...initial,
    validFrom: initial.validFrom?.slice(0, 10) || TODAY,
    validTo:   initial.validTo?.slice(0, 10)   || NEXT_MONTH,
    discountValue:    String(initial.discountValue    || ""),
    maxDiscountAmount: String(initial.maxDiscountAmount || ""),
    minOrderAmount:   String(initial.minOrderAmount   || ""),
    usageLimit:       String(initial.usageLimit       || ""),
  } : { ...EMPTY });
  const [formErr, setFormErr] = useState("");

  function set(k, v) { setForm((p) => ({ ...p, [k]: v })); setFormErr(""); }

  async function handleSave() {
    if (!form.name.trim()) { setFormErr("Display name is required."); return; }
    if (!form.discountValue || Number(form.discountValue) <= 0) { setFormErr("Discount value must be greater than 0."); return; }
    if (!form.validFrom || !form.validTo) { setFormErr("Valid From and Valid To are required."); return; }
    if (new Date(form.validTo) <= new Date(form.validFrom)) { setFormErr("Valid To must be after Valid From."); return; }
    if (form.type === "coupon" && !form.code.trim()) { setFormErr("A coupon code is required for coupon type."); return; }
    await onSave(form);
  }

  const inp = "w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-[12.5px] text-white/85 placeholder:text-white/20 outline-none focus:border-[#7A2267]/60 transition-all";
  const lbl = "block text-[9px] uppercase tracking-[0.18em] text-white/30 font-semibold mb-1.5";

  const APPLICABLE_OPTS = [
    { value: "all",        label: "All Bookings" },
    { value: "night_stay", label: "Night Stays only" },
    { value: "day_long",   label: "Day Visits only" },
  ];

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-end bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full max-w-xl h-full bg-[#0f0f1a] border-l border-white/[0.07] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.07] shrink-0">
          <div>
            <h3 className="text-[15px] font-semibold text-white/90">{initial ? "Edit Discount" : "New Discount"}</h3>
            <p className="text-[11px] text-white/30 mt-0.5">{form.type === "coupon" ? "Requires code at checkout" : "Auto-applied, no code needed"}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/5 transition-all">
            <svg viewBox="0 0 10 10" width="11" height="11" fill="none">
              <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Type */}
          <div>
            <label className={lbl}>Discount Type</label>
            <Segment value={form.type} onChange={(v) => set("type", v)}
              options={[["coupon", "Coupon Code"], ["offer", "Auto Offer"]]} />
          </div>

          {/* Name */}
          <div>
            <label className={lbl}>Display Name *</label>
            <input className={inp} placeholder="e.g. Summer Special 20% Off"
              value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>

          {/* Description */}
          <div>
            <label className={lbl}>Description <span className="normal-case text-white/20 font-normal">(optional)</span></label>
            <textarea className={`${inp} resize-none`} rows={2}
              placeholder="Short description shown to users…"
              value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>

          {/* Coupon-only: Code + Usage Limit */}
          {form.type === "coupon" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Coupon Code *</label>
                <input className={`${inp} uppercase font-mono tracking-widest`} placeholder="e.g. SAVE20"
                  value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} />
              </div>
              <div>
                <label className={lbl}>Usage Limit <span className="normal-case text-white/20 font-normal">(0 = unlimited)</span></label>
                <input type="number" min="0" className={inp} placeholder="0"
                  value={form.usageLimit} onChange={(e) => set("usageLimit", e.target.value)} />
              </div>
            </div>
          )}

          {/* Discount amount */}
          <div>
            <label className={lbl}>Discount Amount *</label>
            <div className="flex gap-2 mb-2">
              {[["percentage", "Percentage %"], ["fixed", "Fixed ৳"]].map(([v, label]) => (
                <button key={v} type="button" onClick={() => set("discountType", v)}
                  className={`flex-1 py-2 rounded-xl border text-[11.5px] font-semibold transition-all
                    ${form.discountType === v ? "bg-[#7A2267] border-[#7A2267] text-white" : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="relative">
              <input type="number" min="0" className={inp}
                placeholder={form.discountType === "percentage" ? "e.g. 20  (for 20%)" : "e.g. 500  (BDT)"}
                value={form.discountValue} onChange={(e) => set("discountValue", e.target.value)} />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-white/30 font-medium pointer-events-none">
                {form.discountType === "percentage" ? "%" : "৳"}
              </span>
            </div>
          </div>

          {/* Cap + Min */}
          <div className="grid grid-cols-2 gap-4">
            {form.discountType === "percentage" && (
              <div>
                <label className={lbl}>Max Discount Cap <span className="normal-case text-white/20 font-normal">(0 = no cap)</span></label>
                <div className="relative">
                  <input type="number" min="0" className={inp} placeholder="0"
                    value={form.maxDiscountAmount} onChange={(e) => set("maxDiscountAmount", e.target.value)} />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-white/30 pointer-events-none">৳</span>
                </div>
              </div>
            )}
            <div>
              <label className={lbl}>Min Order Amount <span className="normal-case text-white/20 font-normal">(0 = none)</span></label>
              <div className="relative">
                <input type="number" min="0" className={inp} placeholder="0"
                  value={form.minOrderAmount} onChange={(e) => set("minOrderAmount", e.target.value)} />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-white/30 pointer-events-none">৳</span>
              </div>
            </div>
          </div>

          {/* Applicable To */}
          <div>
            <label className={lbl}>Applicable To</label>
            <Dropdown value={form.applicableTo} onChange={(v) => set("applicableTo", v)} options={APPLICABLE_OPTS} />
          </div>

          {/* Valid dates */}
          <div>
            <label className={lbl}>Validity Window *</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-white/20 font-medium mb-1">From</p>
                <DatePicker value={form.validFrom} onChange={(v) => set("validFrom", v)} label="start date" />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-white/20 font-medium mb-1">To</p>
                <DatePicker value={form.validTo} onChange={(v) => set("validTo", v)} label="end date" />
              </div>
            </div>
            {form.validFrom && form.validTo && (
              <p className="text-[10.5px] text-white/25 mt-1.5">
                {Math.max(0, Math.round((new Date(form.validTo) - new Date(form.validFrom)) / 86400000))} days
              </p>
            )}
          </div>

          {/* Personal coupon */}
          {form.type === "coupon" && (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3">
              <Toggle value={form.isPersonal} onChange={(v) => set("isPersonal", v)} label="Personal Coupon (assigned to one user)" />
              {form.isPersonal && (
                <div>
                  <label className={lbl}>Assigned User ID</label>
                  <input className={inp} placeholder="MongoDB ObjectId of the user"
                    value={form.assignedUser} onChange={(e) => set("assignedUser", e.target.value)} />
                  <p className="text-[10px] text-white/25 mt-1">Only this user can apply the coupon.</p>
                </div>
              )}
            </div>
          )}

          {/* Active toggle */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <Toggle value={form.isActive} onChange={(v) => set("isActive", v)} label="Active (visible and usable)" />
          </div>

          {formErr && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-[12px] text-red-400">
              {formErr}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.07] flex gap-3 shrink-0 bg-[#0f0f1a]">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/10 text-white/40 text-[12.5px] font-semibold hover:border-white/20 hover:text-white/65 transition-all">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSaving}
            className="flex-[2] py-3 rounded-xl bg-[#7A2267] text-white text-[12.5px] font-semibold hover:bg-[#8e2878] disabled:opacity-60 transition-colors shadow-[0_4px_16px_rgba(122,34,103,0.3)]">
            {isSaving ? "Saving…" : (initial ? "Save Changes" : "Create Discount")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DiscountsPage() {
  const [discounts,  setDiscounts]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [filterType, setFilterType] = useState("");
  const [search,     setSearch]     = useState("");
  const [isPending,  startTransition] = useTransition();

  function reload() {
    setLoading(true);
    getAdminDiscounts({ type: filterType, search })
      .then(setDiscounts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { reload(); }, [filterType]);

  function handleSearchKey(e) { if (e.key === "Enter") reload(); }

  async function handleSave(form) {
    startTransition(async () => {
      try {
        const payload = {
          ...form,
          discountValue:     Number(form.discountValue)    || 0,
          maxDiscountAmount: Number(form.maxDiscountAmount) || 0,
          minOrderAmount:    Number(form.minOrderAmount)   || 0,
          usageLimit:        Number(form.usageLimit)       || 0,
          assignedUser: form.isPersonal && form.assignedUser ? form.assignedUser : null,
        };
        if (modal?._id) {
          await updateDiscount(modal._id, payload);
        } else {
          await createDiscount(payload);
        }
        setModal(null);
        reload();
      } catch (err) {
        alert(err.message || "Error saving discount.");
      }
    });
  }

  async function handleDelete(id) {
    if (!confirm("Delete this discount? This cannot be undone.")) return;
    setDeletingId(id);
    try { await deleteDiscount(id); reload(); }
    catch {} finally { setDeletingId(null); }
  }

  async function handleToggle(id) {
    try { await toggleDiscountActive(id); reload(); } catch {}
  }

  // Compute stats
  const totalActive  = discounts.filter((d) => d.isActive).length;
  const totalCoupons = discounts.filter((d) => d.type === "coupon").length;
  const totalOffers  = discounts.filter((d) => d.type === "offer").length;
  const totalUses    = discounts.reduce((s, d) => s + (d.usedCount || 0), 0);

  return (
    <div className="p-6 lg:p-8 space-y-5 w-full">
      {/* ── Top header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[20px] font-semibold text-white/90 tracking-tight">Discounts & Coupons</h1>
          <p className="text-[11.5px] text-white/30 mt-0.5">Manage auto-offers, coupon codes, and personal rewards</p>
        </div>
        <button
          onClick={() => setModal("create")}
          className="flex items-center gap-2 bg-[#7A2267] hover:bg-[#8e2878] text-white text-[12.5px] font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-[0_4px_16px_rgba(122,34,103,0.3)]">
          <svg viewBox="0 0 14 14" width="13" height="13" fill="none">
            <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          New Discount
        </button>
      </div>

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Discounts" value={discounts.length} sub={`${totalActive} currently active`} />
        <StatCard label="Auto-Offers" value={totalOffers} sub="No code needed" color="text-amber-400" />
        <StatCard label="Coupon Codes" value={totalCoupons} sub="Code at checkout" color="text-violet-400" />
        <StatCard label="Total Uses" value={totalUses} sub="Across all discounts" color="text-emerald-400" />
      </div>

      {/* ── Filters ── */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
          {[["", "All"], ["coupon", "Coupons"], ["offer", "Offers"]].map(([v, label]) => (
            <button key={v} onClick={() => setFilterType(v)}
              className={`px-4 py-1.5 rounded-lg text-[11.5px] font-semibold transition-all
                ${filterType === v ? "bg-[#7A2267] text-white shadow-sm" : "text-white/35 hover:text-white/65"}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-1 min-w-[200px] gap-2">
          <input
            value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={handleSearchKey}
            placeholder="Search name or code… (Enter to search)"
            className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2 text-[12.5px] text-white/70 placeholder:text-white/20 outline-none focus:border-white/15 transition-all"
          />
          <button onClick={reload} className="px-4 py-2 rounded-xl bg-white/[0.06] text-white/50 text-[12px] hover:bg-white/10 hover:text-white/75 transition-all">
            Search
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-20 text-white/20 text-[13px]">Loading…</div>
        ) : discounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                <path d="M9 14l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity=".3"/>
                <rect x="3" y="6" width="18" height="14" rx="2" stroke="white" strokeWidth="1.3" opacity=".2"/>
                <path d="M3 10h18" stroke="white" strokeWidth="1.3" opacity=".2"/>
              </svg>
            </div>
            <p className="text-white/20 text-[13px]">No discounts found. Create one to get started.</p>
            <button onClick={() => setModal("create")} className="px-4 py-2 rounded-xl bg-[#7A2267] text-white text-[12px] font-semibold hover:bg-[#8e2878] transition-colors">
              Create First Discount
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.07] overflow-hidden">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                  {["Name & Code", "Type", "Discount", "Applicable To", "Valid Period", "Usage", "Status", ""].map((h) => (
                    <th key={h} className="px-4 py-3.5 text-left text-[9px] uppercase tracking-[0.18em] text-white/25 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {discounts.map((d) => (
                  <tr key={d._id} className="border-b border-white/[0.04] hover:bg-white/[0.025] transition-colors group">
                    {/* Name & Code */}
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-white/80 max-w-[200px] truncate">{d.name}</p>
                      {d.code ? (
                        <code className="inline-block mt-0.5 px-2 py-0.5 rounded-lg bg-white/[0.06] text-white/55 text-[10px] font-mono tracking-widest border border-white/[0.08]">{d.code}</code>
                      ) : (
                        <span className="text-[10px] text-white/20 mt-0.5 inline-block">Auto-applied</span>
                      )}
                      {d.isPersonal && (
                        <p className="text-[9.5px] text-violet-400 font-medium mt-0.5">Personal · {d.assignedUser?.name || d.assignedUser?.email || "User assigned"}</p>
                      )}
                    </td>
                    {/* Type */}
                    <td className="px-4 py-3.5">
                      <TypeBadge type={d.type} />
                    </td>
                    {/* Discount */}
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-emerald-400">
                        {d.discountType === "percentage" ? `${d.discountValue}%` : fmtBDT(d.discountValue)}
                      </p>
                      {d.discountType === "percentage" && d.maxDiscountAmount > 0 && (
                        <p className="text-[10px] text-white/30 mt-0.5">max {fmtBDT(d.maxDiscountAmount)}</p>
                      )}
                      {d.minOrderAmount > 0 && (
                        <p className="text-[10px] text-white/30 mt-0.5">min order {fmtBDT(d.minOrderAmount)}</p>
                      )}
                    </td>
                    {/* Applicable To */}
                    <td className="px-4 py-3.5">
                      <span className="text-[10px] text-white/45 capitalize">
                        {d.applicableTo === "all" ? "All bookings" : d.applicableTo === "night_stay" ? "Night stays" : "Day visits"}
                      </span>
                    </td>
                    {/* Valid Period */}
                    <td className="px-4 py-3.5">
                      <p className="text-white/45 whitespace-nowrap">{fmtDate(d.validFrom)}</p>
                      <p className="text-[10.5px] text-white/25 whitespace-nowrap">→ {fmtDate(d.validTo)}</p>
                    </td>
                    {/* Usage */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white/65">{d.usedCount}</span>
                        <span className="text-white/25">/ {d.usageLimit > 0 ? d.usageLimit : "∞"}</span>
                      </div>
                      {d.usageLimit > 0 && (
                        <div className="mt-1 h-1 w-16 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#7A2267] rounded-full"
                            style={{ width: `${Math.min(100, (d.usedCount / d.usageLimit) * 100)}%` }}
                          />
                        </div>
                      )}
                    </td>
                    {/* Status toggle */}
                    <td className="px-4 py-3.5">
                      <button onClick={() => handleToggle(d._id)}
                        className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full border transition-all
                          ${d.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
                            : "bg-white/5 text-white/25 border-white/10 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${d.isActive ? "bg-emerald-400" : "bg-white/20"}`} />
                        {d.isActive ? "Active" : "Off"}
                      </button>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setModal(d)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.07] transition-all"
                          title="Edit">
                          <svg viewBox="0 0 14 14" width="12" height="12" fill="none">
                            <path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(d._id)} disabled={deletingId === d._id}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-30"
                          title="Delete">
                          <svg viewBox="0 0 14 14" width="12" height="12" fill="none">
                            <path d="M2 3.5h10M5 3.5V2.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M11.5 3.5l-.75 8a1 1 0 0 1-1 .92H4.25a1 1 0 0 1-1-.92L2.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal (side panel) ── */}
      {modal && (
        <DiscountModal
          initial={modal !== "create" ? modal : null}
          onClose={() => setModal(null)}
          onSave={handleSave}
          isSaving={isPending}
        />
      )}
    </div>
  );
}
