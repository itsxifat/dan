"use client";

import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  changeRoomStatus,
  addRoomNote,
  createOfflineBooking,
  updateOfflineBooking,
  cancelOfflineBooking,
  checkInOffline,
  checkOutOffline,
  addOfflinePayment,
  addMaintenanceIssue,
  resolveMaintenanceIssue,
  resolveConflict,
  markRoomMaintenance,
  getRoomBookingsForRange,
} from "@/actions/admin/roomManagementActions";
import { updateBookingStatus } from "@/actions/accommodation/bookingActions";
import { DatePickerInput, CustomSelect } from "../RoomUIComponents";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  available:   { label: "Available",   dot: "bg-emerald-400", color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10" },
  occupied:    { label: "Occupied",    dot: "bg-blue-400",    color: "text-blue-400",    border: "border-blue-500/30",   bg: "bg-blue-500/10"   },
  maintenance: { label: "Maintenance", dot: "bg-amber-400",   color: "text-amber-400",   border: "border-amber-500/30",  bg: "bg-amber-500/10"  },
  blocked:     { label: "Blocked",     dot: "bg-red-500",     color: "text-red-400",     border: "border-red-500/30",    bg: "bg-red-500/10"    },
};

const PAYMENT_METHODS = ["cash", "bkash", "nagad", "rocket", "bank_transfer", "card", "other"];
const BOOKING_STATUSES = ["reserved", "confirmed", "checked_in", "checked_out", "cancelled", "no_show"];

function fmt(date, opts = {}) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", ...opts,
  });
}
function fmtTime(date) {
  if (!date) return "";
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}
function daysLeft(checkOut) {
  if (!checkOut) return null;
  const diff = new Date(checkOut) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
function nightsCount(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  return Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
}

// ─── Small atoms ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.available;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function SectionCard({ title, children, accent, action }) {
  return (
    <div className={`rounded-xl border ${accent || "border-white/[0.07] bg-white/[0.02]"} overflow-hidden`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
        <p className="text-[11px] uppercase tracking-wider text-white/40 font-semibold">{title}</p>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-white/[0.04] last:border-0">
      <span className="text-[11px] text-white/35 shrink-0">{label}</span>
      <span className={`text-[12px] text-white/75 text-right ${mono ? "font-mono" : ""}`}>{value || "—"}</span>
    </div>
  );
}

function Btn({ children, onClick, disabled, variant = "default", small, className = "" }) {
  const base = `inline-flex items-center gap-1.5 font-medium rounded-lg transition-all duration-200 ${small ? "px-2.5 py-1.5 text-[10px]" : "px-3.5 py-2 text-[11px]"} disabled:opacity-40 disabled:cursor-not-allowed ${className}`;
  const variants = {
    default:   "bg-white/[0.06] border border-white/[0.1] text-white/70 hover:bg-white/[0.1] hover:text-white/90",
    primary:   "bg-[#7A2267] border border-[#7A2267] text-white hover:bg-[#6a1d59]",
    success:   "bg-emerald-600/20 border border-emerald-600/35 text-emerald-400 hover:bg-emerald-600/30",
    danger:    "bg-red-600/15 border border-red-600/30 text-red-400 hover:bg-red-600/25",
    warning:   "bg-amber-600/15 border border-amber-600/30 text-amber-400 hover:bg-amber-600/25",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]}`}>
      {children}
    </button>
  );
}

function Toast({ msg, type = "success" }) {
  const color = type === "error" ? "bg-red-500/15 border-red-500/30 text-red-400"
              : type === "warning" ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
              : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400";
  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3
      rounded-xl border shadow-xl text-[12px] font-medium max-w-xs ${color}`}>
      {msg}
    </div>
  );
}

// ─── Log type icons & colors ──────────────────────────────────────────────────
const LOG_CONFIG = {
  check_in:                { icon: "↓", color: "text-emerald-400 bg-emerald-500/15" },
  check_out:               { icon: "↑", color: "text-amber-400 bg-amber-500/15"    },
  status_change:           { icon: "⇄", color: "text-blue-400 bg-blue-500/15"      },
  maintenance_added:       { icon: "⚠", color: "text-orange-400 bg-orange-500/15" },
  maintenance_resolved:    { icon: "✓", color: "text-emerald-400 bg-emerald-500/15" },
  offline_booking_created: { icon: "✚", color: "text-purple-400 bg-purple-500/15" },
  offline_booking_updated: { icon: "✎", color: "text-blue-400 bg-blue-500/15"     },
  offline_booking_cancelled:{ icon: "✕", color: "text-red-400 bg-red-500/15"     },
  payment_received:        { icon: "৳", color: "text-emerald-400 bg-emerald-500/15" },
  note:                    { icon: "📝", color: "text-white/50 bg-white/8"          },
  conflict_detected:       { icon: "!", color: "text-orange-400 bg-orange-500/20"  },
  conflict_resolved:       { icon: "✓", color: "text-emerald-400 bg-emerald-500/15" },
  transfer_in:             { icon: "→", color: "text-blue-400 bg-blue-500/15"      },
  transfer_out:            { icon: "←", color: "text-blue-400 bg-blue-500/15"      },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function OfflineBookingForm({ roomId, room, onSuccess, onCancel }) {
  const [pending, startTransition] = useTransition();
  const nights = room?.category?.pricePerNight || 0;
  const [form, setForm] = useState({
    primaryGuest: { name: "", phone: "", whatsapp: "", nidNumber: "", gender: "male", age: "", nationality: "Bangladeshi", address: "" },
    checkIn: "",
    checkOut: "",
    pricePerNight: nights,
    discountAmount: 0,
    paidAmount: 0,
    paymentMethod: "cash",
    totalGuests: 1,
    status: "confirmed",
    specialRequests: "",
    adminNotes: "",
  });
  const [err, setErr] = useState("");

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); }
  function setGuest(key, val) { setForm((f) => ({ ...f, primaryGuest: { ...f.primaryGuest, [key]: val } })); }

  const computedNights = form.checkIn && form.checkOut
    ? nightsCount(form.checkIn, form.checkOut) : 0;
  const total = computedNights * Number(form.pricePerNight);
  const final = total - Number(form.discountAmount || 0);

  function submit() {
    setErr("");
    if (!form.primaryGuest.name) return setErr("Guest name is required");
    if (!form.checkIn || !form.checkOut) return setErr("Check-in and check-out dates required");
    if (computedNights <= 0) return setErr("Check-out must be after check-in");
    if (!form.pricePerNight || form.pricePerNight <= 0) return setErr("Price per night required");

    startTransition(async () => {
      try {
        const result = await createOfflineBooking({
          roomId,
          primaryGuest: {
            ...form.primaryGuest,
            age: form.primaryGuest.age ? Number(form.primaryGuest.age) : undefined,
          },
          checkIn: form.checkIn,
          checkOut: form.checkOut,
          pricePerNight: Number(form.pricePerNight),
          discountAmount: Number(form.discountAmount || 0),
          paidAmount: Number(form.paidAmount || 0),
          paymentMethod: form.paymentMethod,
          totalGuests: Number(form.totalGuests),
          status: form.status,
          specialRequests: form.specialRequests,
          adminNotes: form.adminNotes,
        });
        onSuccess(result.offlineBooking?.hasConflict ? "warning" : "success",
          result.offlineBooking?.hasConflict
            ? "Offline booking created — CONFLICT detected with an existing booking!"
            : "Offline booking created successfully");
      } catch (e) {
        setErr(e.message);
      }
    });
  }

  // ── Shared field atoms ────────────────────────────────────────────────────
  const TextInput = ({ label, value, onChange, type = "text", required, half, placeholder }) => (
    <div className={half ? "col-span-1" : "col-span-2"}>
      <label className="block text-[10px] font-medium text-white/35 mb-1.5 tracking-wide">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-3 py-2.5
          text-[12px] text-white/80 outline-none
          focus:border-[#7A2267]/60 focus:bg-white/[0.05]
          hover:border-white/[0.15] transition-all"
      />
    </div>
  );

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">

      {/* ── Section: Primary Guest ──────────────────────────────────────── */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/28 mb-3">
          Primary Guest
        </p>
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Full Name" value={form.primaryGuest.name}
            onChange={(v) => setGuest("name", v)} required />
          <TextInput label="Phone" value={form.primaryGuest.phone}
            onChange={(v) => setGuest("phone", v)} half placeholder="+880…" />
          <TextInput label="WhatsApp" value={form.primaryGuest.whatsapp}
            onChange={(v) => setGuest("whatsapp", v)} half placeholder="+880…" />
          <TextInput label="NID Number" value={form.primaryGuest.nidNumber}
            onChange={(v) => setGuest("nidNumber", v)} half />
          <TextInput label="Age" value={form.primaryGuest.age}
            onChange={(v) => setGuest("age", v)} type="number" half />
          <CustomSelect
            label="Gender" half
            value={form.primaryGuest.gender}
            onChange={(v) => setGuest("gender", v)}
            options={[
              { value: "male",   label: "Male"   },
              { value: "female", label: "Female" },
              { value: "other",  label: "Other"  },
            ]}
          />
          <TextInput label="Address" value={form.primaryGuest.address}
            onChange={(v) => setGuest("address", v)} half />
          <TextInput label="Nationality" value={form.primaryGuest.nationality}
            onChange={(v) => setGuest("nationality", v)} half />
        </div>
      </div>

      {/* ── Section: Stay & Pricing ─────────────────────────────────────── */}
      <div className="pt-4 border-t border-white/[0.06]">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/28 mb-3">
          Stay &amp; Pricing
        </p>
        <div className="grid grid-cols-2 gap-3">
          <DatePickerInput
            label="Check-In Date" required half
            value={form.checkIn}
            onChange={(v) => set("checkIn", v)}
            minDate={today}
          />
          <DatePickerInput
            label="Check-Out Date" required half
            value={form.checkOut}
            onChange={(v) => set("checkOut", v)}
            minDate={form.checkIn || today}
          />
          <TextInput label="Price Per Night (৳)" value={form.pricePerNight}
            onChange={(v) => set("pricePerNight", v)} type="number" half />
          <TextInput label="Discount (৳)" value={form.discountAmount}
            onChange={(v) => set("discountAmount", v)} type="number" half />
          <TextInput label="No. of Guests" value={form.totalGuests}
            onChange={(v) => set("totalGuests", v)} type="number" half />
          <CustomSelect
            label="Booking Status" half
            value={form.status}
            onChange={(v) => set("status", v)}
            options={[
              { value: "reserved",  label: "Reserved"  },
              { value: "confirmed", label: "Confirmed" },
            ]}
          />
        </div>
      </div>

      {/* ── Computed summary ────────────────────────────────────────────── */}
      {computedNights > 0 && (
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl
          border border-white/[0.07] bg-white/[0.04]">
          {[
            { label: "Nights", val: computedNights, plain: true },
            { label: "Subtotal", val: `৳${total.toLocaleString()}` },
            { label: "Final", val: `৳${final.toLocaleString()}`, accent: true },
          ].map(({ label, val, plain, accent }) => (
            <div key={label} className="text-center px-3 py-3 bg-[#0d0d0d]">
              <p className="text-[9px] text-white/28 uppercase tracking-widest mb-1">{label}</p>
              <p className={`text-[17px] font-bold leading-none
                ${accent ? "text-[#c05aae]" : "text-white/80"}`}>
                {val}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Section: Payment at Booking ─────────────────────────────────── */}
      <div className="pt-4 border-t border-white/[0.06]">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/28 mb-3">
          Advance Payment
        </p>
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Amount Paid (৳)" value={form.paidAmount}
            onChange={(v) => set("paidAmount", v)} type="number" half />
          <CustomSelect
            label="Payment Method" half
            value={form.paymentMethod}
            onChange={(v) => set("paymentMethod", v)}
            options={PAYMENT_METHODS.map((m) => ({
              value: m,
              label: m.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            }))}
          />
        </div>
      </div>

      {/* Special requests */}
      <div>
        <label className="block text-[10px] font-medium text-white/35 mb-1.5 tracking-wide">
          Special Requests / Notes
        </label>
        <textarea
          value={form.specialRequests}
          onChange={(e) => set("specialRequests", e.target.value)}
          rows={2}
          placeholder="Any special requirements…"
          className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-3 py-2.5
            text-[12px] text-white/80 outline-none
            focus:border-[#7A2267]/60 focus:bg-white/[0.05]
            hover:border-white/[0.15] transition-all resize-none"
        />
      </div>

      {err && (
        <p className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2.5">
          {err}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <Btn onClick={submit} disabled={pending} variant="primary">
          {pending ? "Creating…" : "Create Offline Booking"}
        </Btn>
        <Btn onClick={onCancel} variant="default">Cancel</Btn>
      </div>
    </div>
  );
}

function PaymentModal({ booking, onClose, onSuccess }) {
  const [pending, startTransition] = useTransition();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  function submit() {
    if (!amount || Number(amount) <= 0) return setErr("Enter a valid amount");
    startTransition(async () => {
      try {
        await addOfflinePayment(booking._id, { amount: Number(amount), method, note });
        onSuccess();
        onClose();
      } catch (e) { setErr(e.message); }
    });
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
      <div className="bg-[#0f0f0f] border border-white/[0.1] rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl shadow-black/60">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-white/85">Record Payment</h3>
          <button onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-lg
              text-white/25 hover:text-white/70 hover:bg-white/[0.07] transition-colors text-[13px]">
            ✕
          </button>
        </div>
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-orange-500/8 border border-orange-500/20">
          <span className="text-[10px] text-white/35">Remaining</span>
          <span className="ml-auto text-[14px] font-bold text-orange-400">
            ৳{booking.remainingAmount?.toLocaleString()}
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-medium text-white/35 mb-1.5 tracking-wide">
              Amount (৳) *
            </label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-3 py-2.5
                text-[12px] text-white/80 outline-none
                focus:border-[#7A2267]/60 hover:border-white/[0.15] transition-all" />
          </div>
          <CustomSelect
            label="Payment Method" fullWidth
            value={method}
            onChange={setMethod}
            options={PAYMENT_METHODS.map((m) => ({
              value: m,
              label: m.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            }))}
          />
          <div>
            <label className="block text-[10px] font-medium text-white/35 mb-1.5 tracking-wide">
              Note
            </label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Optional reference…"
              className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-3 py-2.5
                text-[12px] text-white/80 outline-none
                focus:border-[#7A2267]/60 hover:border-white/[0.15] transition-all" />
          </div>
        </div>

        {err && <p className="text-[11px] text-red-400">{err}</p>}
        <div className="flex gap-2">
          <Btn onClick={submit} disabled={pending} variant="success">
            {pending ? "Saving…" : "Record Payment"}
          </Btn>
          <Btn onClick={onClose} variant="default">Cancel</Btn>
        </div>
      </div>
    </div>
  );
}

function IssueModal({ bookingId, onClose, onSuccess }) {
  const [pending, startTransition] = useTransition();
  const [desc, setDesc] = useState("");
  const [priority, setPriority] = useState("medium");
  const [err, setErr] = useState("");

  function submit() {
    if (!desc.trim()) return setErr("Description required");
    startTransition(async () => {
      try {
        await addMaintenanceIssue(bookingId, { description: desc, priority });
        onSuccess();
        onClose();
      } catch (e) { setErr(e.message); }
    });
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
      <div className="bg-[#0f0f0f] border border-white/[0.1] rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl shadow-black/60">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-white/85">Report Issue</h3>
          <button onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-lg
              text-white/25 hover:text-white/70 hover:bg-white/[0.07] transition-colors text-[13px]">
            ✕
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-medium text-white/35 mb-1.5 tracking-wide">
              Description *
            </label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3}
              placeholder="Describe the issue…"
              className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-3 py-2.5
                text-[12px] text-white/80 outline-none
                focus:border-[#7A2267]/60 hover:border-white/[0.15] transition-all resize-none" />
          </div>
          <CustomSelect
            label="Priority" fullWidth
            value={priority}
            onChange={setPriority}
            options={[
              { value: "low",      label: "Low",      dot: "bg-emerald-400" },
              { value: "medium",   label: "Medium",   dot: "bg-amber-400"   },
              { value: "high",     label: "High",     dot: "bg-orange-400"  },
              { value: "critical", label: "Critical", dot: "bg-red-500"     },
            ]}
          />
        </div>
        {err && <p className="text-[11px] text-red-400">{err}</p>}
        <div className="flex gap-2">
          <Btn onClick={submit} disabled={pending} variant="warning">
            {pending ? "Saving…" : "Report Issue"}
          </Btn>
          <Btn onClick={onClose} variant="default">Cancel</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Room Calendar ────────────────────────────────────────────────────────────

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_ABBR    = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// Booking colors (online = purple, offline = amber), cycled per booking index
const BOOKING_COLORS = [
  { bg: "bg-[#7A2267]/70",   border: "border-[#7A2267]",   text: "text-white",         dot: "bg-[#c05aae]"  },
  { bg: "bg-blue-600/60",    border: "border-blue-500",    text: "text-white",         dot: "bg-blue-400"   },
  { bg: "bg-amber-600/55",   border: "border-amber-500",   text: "text-white",         dot: "bg-amber-400"  },
  { bg: "bg-emerald-700/55", border: "border-emerald-500", text: "text-white",         dot: "bg-emerald-400"},
  { bg: "bg-rose-700/55",    border: "border-rose-500",    text: "text-white",         dot: "bg-rose-400"   },
  { bg: "bg-cyan-700/55",    border: "border-cyan-500",    text: "text-white",         dot: "bg-cyan-400"   },
];

function getBookingColor(booking, index) {
  if (booking.source === "online") return BOOKING_COLORS[index % 2 === 0 ? 0 : 1];
  return BOOKING_COLORS[(index % 2 === 0 ? 2 : 3)];
}

function ymd(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function ymdLocal(y, m, d) {
  return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

function RoomCalendar({ roomId }) {
  const today     = new Date();
  const [year, setYear]       = useState(today.getFullYear());
  const [month, setMonth]     = useState(today.getMonth());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null); // booking object
  const fetchKey = useRef(0);

  const fetchBookings = useCallback(() => {
    const key = ++fetchKey.current;
    const from = new Date(year, month, 1);
    const to   = new Date(year, month + 1, 0, 23, 59, 59); // last day of month
    setLoading(true);
    getRoomBookingsForRange(roomId, from.toISOString(), to.toISOString())
      .then((data) => { if (fetchKey.current === key) setBookings(data); })
      .catch(() => {})
      .finally(() => { if (fetchKey.current === key) setLoading(false); });
  }, [roomId, year, month]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelected(null);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelected(null);
  }
  function goToday() { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelected(null); }

  // Build calendar grid
  const firstDay  = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMon = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstDay + daysInMon) / 7) * 7;
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - firstDay + 1;
    return dayNum >= 1 && dayNum <= daysInMon ? dayNum : null;
  });

  // Build a lookup: dayStr -> [bookingEntry, ...]
  // Each entry: { booking, colorIdx, isStart, isEnd, isOnly }
  const dayMap = {}; // "YYYY-MM-DD" -> [{booking, colorIdx, isStart, isEnd}]
  bookings.forEach((b, idx) => {
    const ciDate = new Date(b.checkIn);
    const coDate = new Date(b.checkOut);
    // Iterate through each day in this month that the booking covers
    for (let d = 1; d <= daysInMon; d++) {
      const cellDate = new Date(year, month, d);
      if (cellDate >= coDate) break; // past checkout
      if (cellDate < ciDate) continue;
      const key = ymdLocal(year, month, d);
      if (!dayMap[key]) dayMap[key] = [];
      const isStart = ymd(ciDate) === key;
      const coDay   = new Date(coDate.getFullYear(), coDate.getMonth(), coDate.getDate());
      const prevDay = new Date(year, month, d - 1);
      const isEnd   = ymd(coDay) === key || (d === daysInMon && coDate > cellDate);
      const actualEnd = new Date(coDate); actualEnd.setDate(actualEnd.getDate() - 1);
      const isEndActual = ymd(actualEnd) === key;
      dayMap[key].push({ booking: b, colorIdx: idx, isStart, isEndActual });
    }
  });

  const todayStr = ymd(today);

  return (
    <div className="space-y-4">
      {/* Header: navigation */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth}
            className="w-7 h-7 flex items-center justify-center rounded-lg
              bg-white/5 border border-white/10 text-white/50 hover:text-white/80
              hover:bg-white/10 transition-all text-[13px]">
            ‹
          </button>
          <span className="text-[15px] font-semibold text-white/85 w-40 text-center">
            {MONTH_NAMES[month]} {year}
          </span>
          <button onClick={nextMonth}
            className="w-7 h-7 flex items-center justify-center rounded-lg
              bg-white/5 border border-white/10 text-white/50 hover:text-white/80
              hover:bg-white/10 transition-all text-[13px]">
            ›
          </button>
        </div>
        <div className="flex items-center gap-2">
          {loading && <span className="text-[10px] text-white/30 animate-pulse">Loading…</span>}
          <button onClick={goToday}
            className="px-3 py-1.5 rounded-lg text-[11px] font-medium
              bg-[#7A2267]/20 border border-[#7A2267]/35 text-[#c05aae]
              hover:bg-[#7A2267]/30 transition-all">
            Today
          </button>
          <button onClick={fetchBookings}
            className="px-3 py-1.5 rounded-lg text-[11px] font-medium
              bg-white/5 border border-white/10 text-white/45
              hover:bg-white/10 hover:text-white/70 transition-all">
            Refresh
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-[10px] text-white/40">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#7A2267]/70 border border-[#7A2267]" />
          Online booking
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber-600/55 border border-amber-500" />
          Offline booking
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-white/10 border border-white/20 ring-1 ring-[#c05aae]/40" />
          Today
        </span>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl border border-white/[0.08] overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-white/[0.03]">
          {DAY_ABBR.map((d) => (
            <div key={d} className="py-2 text-center text-[10px] font-semibold
              uppercase tracking-wider text-white/25 border-b border-white/[0.07]">
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (!day) {
              return (
                <div key={`empty-${idx}`}
                  className="min-h-[88px] bg-white/[0.01] border-b border-r border-white/[0.05]" />
              );
            }
            const key     = ymdLocal(year, month, day);
            const isToday = key === todayStr;
            const entries = dayMap[key] || [];
            const isPast  = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

            return (
              <div key={key}
                className={[
                  "min-h-[88px] p-1 flex flex-col gap-0.5 border-b border-r border-white/[0.05]",
                  "transition-colors duration-100",
                  isToday ? "bg-[#7A2267]/[0.07] ring-1 ring-inset ring-[#7A2267]/30" : "",
                  isPast && !isToday ? "bg-white/[0.008]" : "",
                  entries.length > 0 ? "cursor-default" : "",
                ].join(" ")}>
                {/* Day number */}
                <div className={`text-[11px] font-semibold w-6 h-6 flex items-center justify-center
                  rounded-full mb-0.5 transition-colors ${
                  isToday
                    ? "bg-[#7A2267] text-white"
                    : isPast
                      ? "text-white/25"
                      : "text-white/60"
                }`}>
                  {day}
                </div>

                {/* Booking bars */}
                {entries.map((e, ei) => {
                  const col = getBookingColor(e.booking, e.colorIdx);
                  const isSelected = selected?._id === e.booking._id;
                  return (
                    <button
                      key={`${e.booking._id}-${ei}`}
                      onClick={() => setSelected(isSelected ? null : e.booking)}
                      title={`${e.booking.guestName} · ${e.booking.ref}`}
                      className={[
                        "w-full text-left px-1.5 py-0.5 text-[9px] font-semibold leading-tight",
                        "truncate transition-all duration-100",
                        col.bg, col.text,
                        e.isStart ? "rounded-l-md" : "rounded-l-none",
                        e.isEndActual ? "rounded-r-md" : "rounded-r-none",
                        isSelected ? "ring-1 ring-white/60 opacity-100" : "opacity-90 hover:opacity-100",
                      ].join(" ")}
                    >
                      {e.isStart ? (
                        <span className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${col.dot}`} />
                          {e.booking.guestName}
                        </span>
                      ) : (
                        <span className="opacity-0 select-none">·</span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected booking detail panel */}
      {selected && (
        <div className={`rounded-xl border p-4 space-y-3 transition-all ${
          selected.source === "online"
            ? "border-[#7A2267]/35 bg-[#7A2267]/8"
            : "border-amber-500/30 bg-amber-500/8"
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${
                  selected.source === "online"
                    ? "text-[#c05aae] bg-[#7A2267]/20 border-[#7A2267]/40"
                    : "text-amber-400 bg-amber-500/15 border-amber-500/30"
                }`}>
                  {selected.source === "online" ? "Online" : "Offline"}
                </span>
                <span className="text-[13px] font-bold text-white/90">{selected.guestName}</span>
                {selected.guestPhone && (
                  <span className="text-[11px] text-white/40">{selected.guestPhone}</span>
                )}
              </div>
              <p className="text-[11px] text-white/40 mt-0.5 font-mono">{selected.ref}</p>
            </div>
            <button onClick={() => setSelected(null)}
              className="text-white/25 hover:text-white/60 text-[16px] leading-none mt-0.5">
              ×
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
            <div>
              <p className="text-white/30 text-[9px] uppercase tracking-wider mb-0.5">Check-In</p>
              <p className="text-white/80 font-medium">{fmt(selected.checkIn)}</p>
            </div>
            <div>
              <p className="text-white/30 text-[9px] uppercase tracking-wider mb-0.5">Check-Out</p>
              <p className="text-white/80 font-medium">{fmt(selected.checkOut)}</p>
            </div>
            <div>
              <p className="text-white/30 text-[9px] uppercase tracking-wider mb-0.5">Nights</p>
              <p className="text-white/80 font-medium">{selected.nights || nightsCount(selected.checkIn, selected.checkOut)}</p>
            </div>
            <div>
              <p className="text-white/30 text-[9px] uppercase tracking-wider mb-0.5">Status</p>
              <p className={`font-semibold capitalize ${
                selected.status === "confirmed" ? "text-blue-400" :
                selected.status === "checked_in" ? "text-emerald-400" :
                selected.status === "checked_out" ? "text-white/40" :
                "text-white/60"
              }`}>{selected.status?.replace("_"," ")}</p>
            </div>
            <div>
              <p className="text-white/30 text-[9px] uppercase tracking-wider mb-0.5">Total</p>
              <p className="text-white/80 font-medium">৳{selected.totalAmount?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-white/30 text-[9px] uppercase tracking-wider mb-0.5">Paid</p>
              <p className="text-emerald-400 font-medium">৳{selected.paidAmount?.toLocaleString()}</p>
            </div>
            {selected.remainingAmount > 0 && (
              <div>
                <p className="text-white/30 text-[9px] uppercase tracking-wider mb-0.5">Due</p>
                <p className="text-orange-400 font-semibold">৳{selected.remainingAmount?.toLocaleString()}</p>
              </div>
            )}
            <div>
              <p className="text-white/30 text-[9px] uppercase tracking-wider mb-0.5">Payment</p>
              <p className={`font-medium capitalize ${
                selected.paymentStatus === "paid" ? "text-emerald-400" :
                selected.paymentStatus === "partial" ? "text-amber-400" :
                "text-red-400"
              }`}>{selected.paymentStatus}</p>
            </div>
          </div>

          {selected.source === "online" && (
            <Link href={`/admin/bookings/${selected._id}`}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium
                text-[#c05aae] hover:text-[#d06abf] transition-colors">
              View Full Booking →
            </Link>
          )}
        </div>
      )}

      {/* Monthly summary */}
      {bookings.length > 0 && (
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
          <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold mb-3">
            {MONTH_NAMES[month]} Bookings
          </p>
          <div className="space-y-2">
            {bookings.map((b, idx) => {
              const col = getBookingColor(b, idx);
              return (
                <div key={b._id}
                  className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer
                    border transition-all duration-100 ${
                    selected?._id === b._id
                      ? "border-white/20 bg-white/[0.06]"
                      : "border-transparent hover:bg-white/[0.03] hover:border-white/10"
                  }`}
                  onClick={() => setSelected(selected?._id === b._id ? null : b)}>
                  <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${col.bg} border ${col.border}`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-semibold text-white/75 truncate">{b.guestName}</span>
                    <span className="text-[9.5px] text-white/30 ml-2">{b.ref}</span>
                  </div>
                  <div className="text-[10px] text-white/35 whitespace-nowrap">
                    {fmt(b.checkIn)} → {fmt(b.checkOut)}
                  </div>
                  <div className="text-[10px]">
                    <span className={`px-1.5 py-0.5 rounded-full border text-[9px] font-medium ${
                      b.source === "online"
                        ? "text-[#c05aae] bg-[#7A2267]/15 border-[#7A2267]/30"
                        : "text-amber-400 bg-amber-500/10 border-amber-500/25"
                    }`}>
                      {b.source}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && bookings.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-[13px] text-white/22">No bookings in {MONTH_NAMES[month]} {year}</p>
          <p className="text-[10px] text-white/15 mt-1">This room is fully available this month</p>
        </div>
      )}
    </div>
  );
}

// ─── Main RoomDetailClient ────────────────────────────────────────────────────
export default function RoomDetailClient({
  room, currentOnline, currentOffline, nextOnline, nextOffline,
  hasConflict, history, logs, offlineBookings, canWrite,
}) {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const initialTab  = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [pending, startTransition] = useTransition();

  // UI state
  const [showOfflineForm, setShowOfflineForm] = useState(false);
  const [paymentModal, setPaymentModal]       = useState(null); // offlineBooking
  const [issueModal, setIssueModal]           = useState(null); // offlineBookingId
  const [noteText, setNoteText]               = useState("");
  const [statusReason, setStatusReason]       = useState("");
  const [cancelReason, setCancelReason]       = useState({});
  const [resolveText, setResolveText]         = useState("");
  const [toast, setToast]                     = useState(null);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  function refresh() { router.refresh(); }

  function act(fn, successMsg, type = "success") {
    startTransition(async () => {
      try {
        await fn();
        showToast(successMsg, type);
        refresh();
      } catch (e) {
        showToast(e.message, "error");
      }
    });
  }

  const statusCfg = STATUS_CONFIG[room.status] || STATUS_CONFIG.available;

  // ── Offline booking list ─────────────────────────────────────────
  const activeOffline = offlineBookings.filter(
    (ob) => !["cancelled", "checked_out"].includes(ob.status)
  );
  const pastOffline   = offlineBookings.filter(
    (ob) => ["cancelled", "checked_out"].includes(ob.status)
  );

  const TABS = [
    { id: "overview",  label: "Overview"  },
    { id: "calendar",  label: "Calendar"  },
    { id: "offline",   label: `Offline (${activeOffline.length})` },
    { id: "history",   label: `History (${history.length})`  },
    { id: "log",       label: `Activity Log (${logs.length})` },
  ];

  return (
    <div className="space-y-5">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* ── Header status bar ──────────────────────────────────────────── */}
      <div className={`flex flex-wrap items-center gap-3 p-4 rounded-xl border
        ${hasConflict ? "border-orange-500/40 bg-orange-500/5" : "border-white/[0.07] bg-white/[0.025]"}`}>
        <StatusBadge status={room.status} />

        {hasConflict && (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px]
            bg-orange-500/15 border border-orange-500/30 text-orange-400 font-semibold">
            ⚠ Booking Conflict
          </span>
        )}

        <div className="flex-1" />

        {canWrite && (
          <div className="flex flex-wrap gap-2">
            {/* Status change */}
            {["available","occupied","maintenance","blocked"].filter((s) => s !== room.status).map((s) => (
              <Btn
                key={s}
                small
                variant={s === "maintenance" ? "warning" : s === "blocked" ? "danger" : s === "available" ? "success" : "default"}
                onClick={() => act(
                  () => changeRoomStatus(room._id, s, "Manual override"),
                  `Room marked as ${s}`
                )}
                disabled={pending}
              >
                → {STATUS_CONFIG[s]?.label}
              </Btn>
            ))}

            {/* Check in / out for current offline booking */}
            {currentOffline?.status === "confirmed" || currentOffline?.status === "reserved" ? (
              <Btn small variant="success" disabled={pending}
                onClick={() => act(() => checkInOffline(currentOffline._id), "Guest checked in!")}>
                Check In (Offline)
              </Btn>
            ) : currentOffline?.status === "checked_in" ? (
              <Btn small variant="warning" disabled={pending}
                onClick={() => act(() => checkOutOffline(currentOffline._id), "Guest checked out!")}>
                Check Out (Offline)
              </Btn>
            ) : null}

            {/* Check in / out for current online booking */}
            {currentOnline?.status === "confirmed" && (
              <Btn small variant="success" disabled={pending}
                onClick={() => act(
                  () => updateBookingStatus(currentOnline._id, "checked_in"),
                  "Online guest checked in!"
                )}>
                Check In (Online)
              </Btn>
            )}
            {currentOnline?.status === "checked_in" && (
              <Btn small variant="warning" disabled={pending}
                onClick={() => act(
                  () => updateBookingStatus(currentOnline._id, "checked_out"),
                  "Online guest checked out!"
                )}>
                Check Out (Online)
              </Btn>
            )}

            {!showOfflineForm && (
              <Btn small variant="primary" onClick={() => setShowOfflineForm(true)}>
                + Offline Booking
              </Btn>
            )}
          </div>
        )}
      </div>

      {/* ── Offline booking form ──────────────────────────────────────────── */}
      {showOfflineForm && canWrite && (
        <SectionCard title="New Offline Booking" accent="border-[#7A2267]/30 bg-[#7A2267]/5">
          <OfflineBookingForm
            roomId={room._id}
            room={room}
            onSuccess={(type, msg) => {
              setShowOfflineForm(false);
              showToast(msg, type);
              refresh();
            }}
            onCancel={() => setShowOfflineForm(false)}
          />
        </SectionCard>
      )}

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex border-b border-white/[0.07] gap-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-[11px] font-medium transition-colors border-b-2 -mb-px
              ${activeTab === tab.id
                ? "border-[#7A2267] text-white/90"
                : "border-transparent text-white/35 hover:text-white/60"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════ TAB: OVERVIEW ══════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Room Info */}
          <SectionCard title="Room Details">
            <InfoRow label="Room Number"   value={room.roomNumber} />
            <InfoRow label="Property"      value={room.property?.name} />
            <InfoRow label="Category"      value={room.category?.name} />
            <InfoRow label="Floor"         value={room.floor} />
            {room.block  && <InfoRow label="Block"         value={room.block} />}
            {room.facing && <InfoRow label="Facing"        value={room.facing} />}
            <InfoRow label="Bed Type"      value={room.category?.bedType} />
            <InfoRow label="Max Adults"    value={room.category?.maxAdults} />
            <InfoRow label="Max Children"  value={room.category?.maxChildren} />
            <InfoRow label="Price/Night"   value={`৳${room.pricePerNight || room.category?.pricePerNight || 0}`} />
            {room.notes && <InfoRow label="Notes" value={room.notes} />}
          </SectionCard>

          {/* Current Occupancy */}
          <div className="space-y-4">
            {currentOnline && (
              <SectionCard title="Current Online Booking" accent="border-blue-500/25 bg-blue-500/5">
                <InfoRow label="Booking #"    value={currentOnline.bookingNumber} mono />
                <InfoRow label="Guest"        value={currentOnline.primaryGuest?.name} />
                <InfoRow label="Phone"        value={currentOnline.primaryGuest?.phone} />
                <InfoRow label="Check-In"     value={fmt(currentOnline.checkIn)} />
                <InfoRow label="Check-Out"    value={fmt(currentOnline.checkOut)} />
                <InfoRow label="Nights Left"  value={`${Math.max(0, daysLeft(currentOnline.checkOut))} nights`} />
                <InfoRow label="Total"        value={`৳${currentOnline.totalAmount?.toLocaleString()}`} />
                <InfoRow label="Paid"         value={`৳${currentOnline.paidAmount?.toLocaleString()}`} />
                <InfoRow label="Status"       value={currentOnline.status} />
                <div className="pt-2">
                  <Link
                    href={`/admin/bookings/${currentOnline._id}`}
                    className="text-[11px] text-[#c05aae] hover:underline"
                  >
                    View Full Booking →
                  </Link>
                </div>
              </SectionCard>
            )}

            {currentOffline && (
              <SectionCard
                title="Current Offline Booking"
                accent={currentOffline.hasConflict ? "border-orange-500/30 bg-orange-500/5" : "border-amber-500/25 bg-amber-500/5"}
              >
                <InfoRow label="Reference"   value={currentOffline.referenceNumber} mono />
                <InfoRow label="Guest"       value={currentOffline.primaryGuest?.name} />
                <InfoRow label="Phone"       value={currentOffline.primaryGuest?.phone} />
                <InfoRow label="Check-In"    value={fmt(currentOffline.checkIn)} />
                <InfoRow label="Check-Out"   value={fmt(currentOffline.checkOut)} />
                <InfoRow label="Nights Left" value={`${Math.max(0, daysLeft(currentOffline.checkOut))} nights`} />
                <InfoRow label="Total"       value={`৳${currentOffline.finalAmount?.toLocaleString()}`} />
                <InfoRow label="Paid"        value={`৳${currentOffline.paidAmount?.toLocaleString()}`} />
                <InfoRow label="Remaining"   value={`৳${currentOffline.remainingAmount?.toLocaleString()}`} />
                <InfoRow label="Status"      value={currentOffline.status} />
                {currentOffline.hasConflict && (
                  <div className="mt-3 p-2.5 rounded-lg bg-orange-500/15 border border-orange-500/25 text-[11px] text-orange-300">
                    ⚠ {currentOffline.conflictNote || "Conflict with online booking"}
                  </div>
                )}
                {canWrite && currentOffline.remainingAmount > 0 && (
                  <div className="pt-2 flex gap-2 flex-wrap">
                    <Btn small variant="success"
                      onClick={() => setPaymentModal(currentOffline)}>
                      + Record Payment
                    </Btn>
                    {currentOffline.hasConflict && (
                      <Btn small variant="warning" disabled={pending}
                        onClick={() => {
                          const r = prompt("How was the conflict resolved?");
                          if (r) act(() => resolveConflict(currentOffline._id, r), "Conflict resolved");
                        }}>
                        Resolve Conflict
                      </Btn>
                    )}
                  </div>
                )}
              </SectionCard>
            )}

            {!currentOnline && !currentOffline && (
              <SectionCard title="Current Occupancy">
                <p className="text-[12px] text-white/30 py-4 text-center">Room is currently unoccupied</p>
              </SectionCard>
            )}

            {/* Next booking */}
            {(nextOnline || nextOffline) && (
              <SectionCard title="Upcoming Reservation">
                {nextOnline && (
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-blue-400 font-semibold">Online</span>
                    <InfoRow label="Guest"     value={nextOnline.primaryGuest?.name} />
                    <InfoRow label="Check-In"  value={fmt(nextOnline.checkIn)} />
                    <InfoRow label="Check-Out" value={fmt(nextOnline.checkOut)} />
                  </div>
                )}
                {nextOffline && (
                  <div className="space-y-1 mt-2">
                    <span className="text-[9px] uppercase tracking-wider text-amber-400 font-semibold">Offline</span>
                    <InfoRow label="Guest"     value={nextOffline.primaryGuest?.name} />
                    <InfoRow label="Check-In"  value={fmt(nextOffline.checkIn)} />
                    <InfoRow label="Check-Out" value={fmt(nextOffline.checkOut)} />
                  </div>
                )}
              </SectionCard>
            )}
          </div>

          {/* Note */}
          {canWrite && (
            <SectionCard title="Add Staff Note" accent="col-span-full border-white/[0.07] bg-white/[0.02]">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a note about this room…"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2
                    text-[12px] text-white/80 outline-none focus:border-[#7A2267]/50"
                />
                <Btn
                  variant="default"
                  disabled={pending || !noteText.trim()}
                  onClick={() => act(() => addRoomNote(room._id, noteText), "Note saved").then(() => setNoteText(""))}
                >
                  Save Note
                </Btn>
              </div>
            </SectionCard>
          )}
        </div>
      )}

      {/* ═══════════ TAB: CALENDAR ═══════════════════════════════════════════ */}
      {activeTab === "calendar" && (
        <RoomCalendar roomId={room._id} />
      )}

      {/* ═══════════ TAB: OFFLINE BOOKINGS ══════════════════════════════════ */}
      {activeTab === "offline" && (
        <div className="space-y-4">
          {activeOffline.length === 0 && pastOffline.length === 0 && (
            <div className="py-16 text-center text-white/25 text-[13px]">
              No offline bookings yet.
              {canWrite && (
                <button onClick={() => { setActiveTab("overview"); setShowOfflineForm(true); }}
                  className="ml-2 text-[#c05aae] hover:underline">Create one →</button>
              )}
            </div>
          )}

          {activeOffline.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold">Active</p>
              {activeOffline.map((ob) => (
                <OfflineBookingCard
                  key={ob._id}
                  ob={ob}
                  canWrite={canWrite}
                  pending={pending}
                  onPayment={() => setPaymentModal(ob)}
                  onIssue={() => setIssueModal(ob._id)}
                  onCheckIn={() => act(() => checkInOffline(ob._id), "Guest checked in!")}
                  onCheckOut={() => act(() => checkOutOffline(ob._id), "Guest checked out!")}
                  onCancel={(reason) => act(() => cancelOfflineBooking(ob._id, reason), "Booking cancelled")}
                  onResolveConflict={(res) => act(() => resolveConflict(ob._id, res), "Conflict resolved")}
                  onResolveIssue={(issueId, res) => act(
                    () => resolveMaintenanceIssue(ob._id, issueId, res),
                    "Issue resolved"
                  )}
                />
              ))}
            </div>
          )}

          {pastOffline.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold mt-4">Past / Cancelled</p>
              {pastOffline.map((ob) => (
                <OfflineBookingCard key={ob._id} ob={ob} canWrite={false} pending={false} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════ TAB: HISTORY ════════════════════════════════════════════ */}
      {activeTab === "history" && (
        <div className="space-y-2">
          {history.length === 0 ? (
            <div className="py-16 text-center text-white/25 text-[13px]">No booking history yet</div>
          ) : history.map((b) => {
            const isOnline  = b._source === "online";
            const nights    = nightsCount(b.checkIn, b.checkOut);
            const amount    = isOnline ? b.totalAmount : b.finalAmount;
            const paid      = b.paidAmount;
            const remaining = isOnline ? (b.totalAmount - b.paidAmount) : (b.finalAmount - b.paidAmount);
            const statusColors = {
              confirmed:   "text-blue-400", checked_in: "text-emerald-400",
              checked_out: "text-white/40", cancelled:  "text-red-400",
              no_show:     "text-orange-400", reserved: "text-purple-400",
            };
            return (
              <div key={b._id || b.referenceNumber}
                className="flex flex-wrap items-start gap-3 p-4 rounded-xl
                  bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.035] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded
                      ${isOnline ? "text-blue-400 bg-blue-500/10 border border-blue-500/20"
                                 : "text-amber-400 bg-amber-500/10 border border-amber-500/20"}`}>
                      {isOnline ? "Online" : "Offline"}
                    </span>
                    <span className="text-[11px] font-medium text-white/80">
                      {b.primaryGuest?.name}
                    </span>
                    <span className={`text-[10px] font-medium ${statusColors[b.status] || "text-white/40"}`}>
                      {b.status?.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/35 mt-1">
                    {fmt(b.checkIn)} → {fmt(b.checkOut)} · {nights} nights
                    <span className="mx-1.5 opacity-30">|</span>
                    {b.bookingNumber || b.referenceNumber}
                    {b.primaryGuest?.phone && (
                      <><span className="mx-1.5 opacity-30">|</span>{b.primaryGuest.phone}</>
                    )}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[13px] font-semibold text-white/75">৳{amount?.toLocaleString()}</p>
                  {remaining > 0 && (
                    <p className="text-[10px] text-orange-400">৳{remaining.toLocaleString()} due</p>
                  )}
                  {isOnline && (
                    <Link href={`/admin/bookings/${b._id}`}
                      className="text-[10px] text-[#c05aae] hover:underline">
                      View →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════ TAB: ACTIVITY LOG ════════════════════════════════════════ */}
      {activeTab === "log" && (
        <div className="space-y-2">
          {logs.length === 0 ? (
            <div className="py-16 text-center text-white/25 text-[13px]">No activity logged yet</div>
          ) : logs.map((log) => {
            const cfg = LOG_CONFIG[log.type] || { icon: "·", color: "text-white/40 bg-white/8" };
            return (
              <div key={log._id}
                className="flex items-start gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
                <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center
                  text-[11px] font-bold ${cfg.color}`}>
                  {cfg.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-white/75">{log.message}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">
                    {log.performedByName || "System"}
                    <span className="mx-1.5 opacity-30">·</span>
                    {fmtTime(log.createdAt)}
                  </p>
                </div>
                <span className="text-[9px] text-white/20 shrink-0 mt-1">
                  {log.type?.replace(/_/g, " ")}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {paymentModal && (
        <PaymentModal
          booking={paymentModal}
          onClose={() => setPaymentModal(null)}
          onSuccess={() => { showToast("Payment recorded"); refresh(); }}
        />
      )}
      {issueModal && (
        <IssueModal
          bookingId={issueModal}
          onClose={() => setIssueModal(null)}
          onSuccess={() => { showToast("Issue reported", "warning"); refresh(); }}
        />
      )}
    </div>
  );
}

// ─── Offline booking card ─────────────────────────────────────────────────────
function OfflineBookingCard({ ob, canWrite, pending, onPayment, onIssue, onCheckIn, onCheckOut, onCancel, onResolveConflict, onResolveIssue }) {
  const [expanded, setExpanded] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancel, setShowCancel]     = useState(false);
  const [resolveText, setResolveText]   = useState("");

  const statusColors = {
    confirmed:  "text-blue-400 bg-blue-500/10 border-blue-500/25",
    reserved:   "text-purple-400 bg-purple-500/10 border-purple-500/25",
    checked_in: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    checked_out:"text-white/40 bg-white/5 border-white/10",
    cancelled:  "text-red-400 bg-red-500/10 border-red-500/25",
    no_show:    "text-orange-400 bg-orange-500/10 border-orange-500/25",
  };
  const sc = statusColors[ob.status] || statusColors.confirmed;

  const openIssues = ob.issues?.filter((i) => i.status !== "resolved") || [];

  return (
    <div className={`rounded-xl border transition-all
      ${ob.hasConflict ? "border-orange-500/35 bg-orange-500/5" : "border-white/[0.07] bg-white/[0.025]"}`}>

      {/* Header row */}
      <div className="flex flex-wrap items-center gap-3 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-white/85">{ob.primaryGuest?.name}</span>
            <span className={`text-[9px] uppercase tracking-wider font-semibold border px-1.5 py-0.5 rounded-full ${sc}`}>
              {ob.status?.replace("_", " ")}
            </span>
            {ob.hasConflict && (
              <span className="text-[9px] uppercase font-bold text-orange-400 bg-orange-500/15
                border border-orange-500/25 px-1.5 py-0.5 rounded-full">⚠ Conflict</span>
            )}
            {openIssues.length > 0 && (
              <span className="text-[9px] text-amber-400">{openIssues.length} open issue{openIssues.length > 1 ? "s" : ""}</span>
            )}
          </div>
          <p className="text-[10px] text-white/35 mt-0.5">
            {ob.referenceNumber}
            <span className="mx-1.5 opacity-30">·</span>
            {new Date(ob.checkIn).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
            {" → "}
            {new Date(ob.checkOut).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
            {" · "}
            {ob.nights} nights
            {ob.primaryGuest?.phone && (
              <><span className="mx-1.5 opacity-30">·</span>{ob.primaryGuest.phone}</>
            )}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[13px] font-semibold text-white/75">৳{ob.finalAmount?.toLocaleString()}</p>
          {ob.remainingAmount > 0 && (
            <p className="text-[10px] text-orange-400">৳{ob.remainingAmount?.toLocaleString()} remaining</p>
          )}
          {ob.remainingAmount === 0 && <p className="text-[10px] text-emerald-400">Fully paid</p>}
        </div>
        <button
          onClick={() => setExpanded((p) => !p)}
          className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
        >
          {expanded ? "▲" : "▼"}
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/[0.06]">

          {/* Guest details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 pt-3">
            {[
              ["Phone", ob.primaryGuest?.phone],
              ["WhatsApp", ob.primaryGuest?.whatsapp],
              ["NID", ob.primaryGuest?.nidNumber],
              ["Gender", ob.primaryGuest?.gender],
              ["Age", ob.primaryGuest?.age],
              ["Address", ob.primaryGuest?.address],
              ["Nationality", ob.primaryGuest?.nationality],
              ["Guests", ob.totalGuests],
              ["Price/Night", `৳${ob.pricePerNight?.toLocaleString()}`],
              ["Discount", ob.discountAmount > 0 ? `৳${ob.discountAmount?.toLocaleString()}` : null],
              ["Actual Check-In",  ob.actualCheckIn  ? new Date(ob.actualCheckIn).toLocaleString()  : null],
              ["Actual Check-Out", ob.actualCheckOut ? new Date(ob.actualCheckOut).toLocaleString() : null],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={k}>
                <p className="text-[9px] uppercase tracking-wider text-white/25">{k}</p>
                <p className="text-[11px] text-white/65">{v}</p>
              </div>
            ))}
          </div>

          {/* Payments */}
          {ob.payments?.length > 0 && (
            <div>
              <p className="text-[9px] uppercase tracking-wider text-white/25 mb-2">Payment Records</p>
              <div className="space-y-1">
                {ob.payments.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <span className="text-white/50">
                      {new Date(p.receivedAt).toLocaleDateString("en-GB")} · {p.method}
                      {p.note && ` — ${p.note}`}
                    </span>
                    <span className="text-emerald-400 font-medium">৳{p.amount?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Issues */}
          {ob.issues?.length > 0 && (
            <div>
              <p className="text-[9px] uppercase tracking-wider text-white/25 mb-2">Issues</p>
              <div className="space-y-2">
                {ob.issues.map((issue) => (
                  <div key={issue._id}
                    className={`p-2.5 rounded-lg border text-[11px]
                      ${issue.status === "resolved"
                        ? "border-white/[0.06] bg-white/[0.02] text-white/40"
                        : "border-amber-500/25 bg-amber-500/8 text-amber-300"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`text-[8px] uppercase font-bold mr-1.5
                          ${issue.priority === "critical" ? "text-red-400"
                            : issue.priority === "high" ? "text-orange-400"
                            : "text-amber-400"}`}>
                          [{issue.priority}]
                        </span>
                        {issue.description}
                        {issue.resolution && (
                          <span className="text-white/30 ml-2">→ {issue.resolution}</span>
                        )}
                      </div>
                      {canWrite && issue.status !== "resolved" && (
                        <button
                          onClick={() => {
                            const res = prompt("Resolution note:");
                            if (res) onResolveIssue(issue._id, res);
                          }}
                          className="shrink-0 text-[9px] text-emerald-400 hover:underline"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                    <p className="text-[9px] text-white/25 mt-1">
                      Reported by {issue.reportedByName || "Staff"} · {new Date(issue.reportedAt).toLocaleDateString("en-GB")}
                      {issue.resolvedAt && ` · Resolved ${new Date(issue.resolvedAt).toLocaleDateString("en-GB")}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conflict detail */}
          {ob.hasConflict && ob.conflictNote && (
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/25 text-[11px] text-orange-300">
              ⚠ {ob.conflictNote}
              {canWrite && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Resolution note…"
                    value={resolveText}
                    onChange={(e) => setResolveText(e.target.value)}
                    className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1
                      text-[10px] text-white/70 outline-none"
                  />
                  <button
                    onClick={() => { if (resolveText) onResolveConflict(resolveText); }}
                    className="text-[10px] px-2 py-1 bg-orange-500/20 border border-orange-500/30
                      text-orange-300 rounded hover:bg-orange-500/30 transition-colors"
                  >
                    Resolve
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {(ob.specialRequests || ob.adminNotes || ob.internalNotes) && (
            <div className="space-y-1">
              {ob.specialRequests && <p className="text-[11px] text-white/45"><span className="text-white/25 text-[10px]">Requests:</span> {ob.specialRequests}</p>}
              {ob.adminNotes      && <p className="text-[11px] text-white/45"><span className="text-white/25 text-[10px]">Admin notes:</span> {ob.adminNotes}</p>}
              {ob.internalNotes   && <p className="text-[11px] text-white/45"><span className="text-white/25 text-[10px]">Internal:</span> {ob.internalNotes}</p>}
            </div>
          )}

          {/* Actions */}
          {canWrite && !["cancelled", "checked_out", "no_show"].includes(ob.status) && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.06]">
              {(ob.status === "confirmed" || ob.status === "reserved") && (
                <Btn small variant="success" onClick={onCheckIn} disabled={pending}>Check In</Btn>
              )}
              {ob.status === "checked_in" && (
                <Btn small variant="warning" onClick={onCheckOut} disabled={pending}>Check Out</Btn>
              )}
              {ob.remainingAmount > 0 && (
                <Btn small variant="default" onClick={onPayment}>+ Payment</Btn>
              )}
              <Btn small variant="warning" onClick={onIssue}>Report Issue</Btn>
              {!showCancel ? (
                <Btn small variant="danger" onClick={() => setShowCancel(true)}>Cancel Booking</Btn>
              ) : (
                <div className="flex gap-1.5 items-center w-full">
                  <input
                    type="text"
                    placeholder="Cancellation reason…"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="flex-1 bg-white/[0.04] border border-red-500/25 rounded-lg px-2.5 py-1.5
                      text-[11px] text-white/70 outline-none"
                  />
                  <Btn small variant="danger" disabled={pending}
                    onClick={() => { onCancel(cancelReason); setShowCancel(false); }}>
                    Confirm
                  </Btn>
                  <Btn small variant="default" onClick={() => setShowCancel(false)}>×</Btn>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
