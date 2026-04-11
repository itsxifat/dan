"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Montserrat, Playfair_Display } from "next/font/google";
import { updateProfile, updateProfileImage } from "@/actions/account/accountActions";
import { changePassword } from "@/actions/authActions";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
const playfair   = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600"] });

// ─── Shared styles ─────────────────────────────────────────────────────────────
const FI = `w-full bg-[#FDFCFC] border border-[#EDE5F0] rounded-xl px-4 py-3 text-[13.5px]
  text-[#1a1a1a] placeholder:text-[#C4B3CE] outline-none
  focus:border-[#7A2267]/40 focus:shadow-[0_0_0_3px_rgba(122,34,103,0.06)]
  transition-all duration-200`;
const FL = "block text-[9.5px] uppercase tracking-[0.14em] text-[#9B8BAB] font-semibold mb-1.5";

// ─── Status colours ────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  pending:     { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-400"   },
  confirmed:   { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    dot: "bg-blue-400"    },
  checked_in:  { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  checked_out: { bg: "bg-slate-50",   text: "text-slate-600",   border: "border-slate-200",   dot: "bg-slate-400"   },
  cancelled:   { bg: "bg-red-50",     text: "text-red-600",     border: "border-red-200",     dot: "bg-red-400"     },
  no_show:     { bg: "bg-orange-50",  text: "text-orange-600",  border: "border-orange-200",  dot: "bg-orange-400"  },
};

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider
      px-2.5 py-1 rounded-full border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Payment bar ──────────────────────────────────────────────────────────────
function PaymentBar({ paid, total }) {
  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className={`${montserrat.className} flex justify-between text-[10px] text-[#9B8BAB]`}>
        <span>Paid ৳{(paid || 0).toLocaleString()} of ৳{(total || 0).toLocaleString()}</span>
        <span className="font-semibold text-[#7A2267]">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#EDE5F0] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? "bg-emerald-500" : "bg-[#7A2267]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Booking card ─────────────────────────────────────────────────────────────
function BookingCard({ booking }) {
  const isDayLong   = booking.bookingMode === "day_long";
  const isMultiRoom = booking.roomBookings?.length > 0;

  const paidAmount  = booking.paidAmount      ?? 0;
  const totalAmount = booking.totalAmount     ?? 0;
  const remaining   = booking.remainingAmount ?? 0;
  const dayDisc     = booking.dayLongDiscount ?? 0;
  const offerDisc   = booking.offerDiscount   ?? 0;
  const couponDisc  = booking.couponDiscount  ?? 0;
  const totalSaved  = dayDisc + offerDisc + couponDisc;

  // Partial: DB says so OR paidAmount < totalAmount (catches edge cases)
  const isPartial = booking.paymentStatus === "partial" ||
    (paidAmount > 0 && totalAmount > 0 && paidAmount < totalAmount - 1);

  return (
    <div className="bg-white border border-[#EDE5F0] rounded-2xl overflow-hidden hover:shadow-[0_4px_24px_rgba(122,34,103,0.08)] transition-shadow duration-200">

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`${montserrat.className} text-[11px] text-[#9B8BAB] font-mono tracking-wide`}>
                {booking.bookingNumber}
              </p>
              <span className={`${montserrat.className} text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full
                ${isDayLong ? "bg-amber-100 text-amber-700" : "bg-[#7A2267]/10 text-[#7A2267]"}`}>
                {isDayLong ? "Day Long" : "Night Stay"}
              </span>
            </div>
            <p className={`${montserrat.className} text-[14.5px] font-semibold text-[#1C1C1C] mt-1 truncate`}>
              {booking.property?.name || "Property"}
            </p>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        {/* Dates */}
        <div className="flex items-center gap-3 text-[12px]">
          <div>
            <p className={`${montserrat.className} text-[9px] uppercase tracking-[0.12em] text-[#9B8BAB] font-semibold mb-0.5`}>
              {isDayLong ? "Date" : "Check-in"}
            </p>
            <p className={`${montserrat.className} text-[#1C1C1C] font-medium`}>{fmtDate(booking.checkIn)}</p>
          </div>
          {!isDayLong && (
            <>
              <svg viewBox="0 0 14 6" width="14" height="6" fill="none" className="shrink-0 mt-3">
                <path d="M1 3h12M9 1l2 2-2 2" stroke="#C4B3CE" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <p className={`${montserrat.className} text-[9px] uppercase tracking-[0.12em] text-[#9B8BAB] font-semibold mb-0.5`}>
                  Check-out
                </p>
                <p className={`${montserrat.className} text-[#1C1C1C] font-medium`}>{fmtDate(booking.checkOut)}</p>
              </div>
              {booking.nights > 0 && (
                <span className={`${montserrat.className} ml-1 text-[10px] text-[#9B8BAB] bg-[#F5EDF5] px-2 py-0.5 rounded-full mt-3`}>
                  {booking.nights}N
                </span>
              )}
            </>
          )}
        </div>

        {/* Rooms */}
        {isMultiRoom ? (
          <div className="space-y-1.5">
            {booking.roomBookings.map((rb, i) => (
              <div key={i} className={`${montserrat.className} flex items-center gap-2 text-[12px] text-[#5C4A6E] bg-[#F9F5FB] rounded-lg px-3 py-2`}>
                <svg viewBox="0 0 14 14" width="12" height="12" fill="none" className="shrink-0">
                  <rect x="1" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M4 4V2.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V4" stroke="currentColor" strokeWidth="1.2" />
                </svg>
                <span className="font-medium">
                  {rb.room?.roomNumber ? `Room #${rb.room.roomNumber}` : `Room ${i + 1}`}
                  {rb.room?.floor ? ` · Floor ${rb.room.floor}` : ""}
                </span>
                {rb.category?.name && <span className="text-[#9B8BAB]">· {rb.category.name}</span>}
                {rb.guests?.length > 0 && (
                  <span className="ml-auto text-[10px] text-[#9B8BAB]">{rb.guests.length} guest{rb.guests.length !== 1 ? "s" : ""}</span>
                )}
              </div>
            ))}
          </div>
        ) : booking.room ? (
          <div className={`${montserrat.className} flex items-center gap-2 text-[12px] text-[#5C4A6E] bg-[#F9F5FB] rounded-lg px-3 py-2`}>
            <svg viewBox="0 0 14 14" width="12" height="12" fill="none" className="shrink-0">
              <rect x="1" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M4 4V2.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V4" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            <span className="font-medium">Room #{booking.room.roomNumber} · Floor {booking.room.floor}</span>
            {booking.category?.name && <span className="text-[#9B8BAB]">· {booking.category.name}</span>}
          </div>
        ) : null}

        {/* Payment summary */}
        <div className="border-t border-[#F3EDF5] pt-4 space-y-2">
          <div className="flex items-end justify-between">
            <div className="space-y-0.5">
              <p className={`${montserrat.className} text-[9px] uppercase tracking-[0.12em] text-[#9B8BAB] font-semibold`}>
                Total Amount
              </p>
              <p className={`${montserrat.className} text-[18px] font-bold text-[#7A2267]`}>
                ৳{totalAmount.toLocaleString()}
              </p>
              {totalSaved > 0 && (
                <p className={`${montserrat.className} text-[10px] text-emerald-600 font-semibold`}>
                  Saved ৳{totalSaved.toLocaleString()}
                </p>
              )}
            </div>

            {/* Right side: remaining / payment badge */}
            <div className="text-right space-y-0.5">
              {isPartial && remaining > 0 ? (
                <>
                  <p className={`${montserrat.className} text-[9px] uppercase tracking-[0.12em] text-orange-500 font-semibold`}>Due at Check-in</p>
                  <p className={`${montserrat.className} text-[13px] font-semibold text-orange-500`}>৳{remaining.toLocaleString()}</p>
                </>
              ) : booking.paymentStatus === "paid" ? (
                <>
                  <p className={`${montserrat.className} text-[9px] uppercase tracking-[0.12em] text-emerald-600 font-semibold`}>Paid in Full</p>
                </>
              ) : null}
            </div>
          </div>

          {/* Payment bar */}
          {totalAmount > 0 && (
            <PaymentBar paid={paidAmount} total={totalAmount} />
          )}
        </div>

        {/* Invoice link */}
        <Link
          href={`/account/invoice/${booking._id}`}
          className={`${montserrat.className} flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
            border border-[#7A2267]/20 text-[#7A2267] text-[12px] font-semibold
            hover:bg-[#7A2267]/5 hover:border-[#7A2267]/35 transition-all duration-200`}
        >
          <svg viewBox="0 0 14 14" width="12" height="12" fill="none">
            <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" />
            <path d="M4 5h6M4 7.5h6M4 10h3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          View Invoice
        </Link>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ message, linkHref, linkLabel }) {
  return (
    <div className="bg-white border border-[#EDE5F0] rounded-2xl p-12 text-center">
      <div className="w-12 h-12 rounded-full bg-[#7A2267]/8 flex items-center justify-center mx-auto mb-3">
        <svg viewBox="0 0 20 20" width="22" height="22" fill="none">
          <rect x="3" y="5" width="14" height="12" rx="2" stroke="#C4B3CE" strokeWidth="1.4" />
          <path d="M7 9h6M7 12h4" stroke="#C4B3CE" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>
      <p className={`${montserrat.className} text-[13px] text-[#9B8BAB]`}>{message}</p>
      {linkHref && (
        <Link href={linkHref} className={`${montserrat.className} mt-3 inline-block text-[12.5px] text-[#7A2267] font-semibold hover:underline`}>
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

// ─── Password section ─────────────────────────────────────────────────────────
function PasswordSection({ hasPassword }) {
  const [form, setForm]       = useState({ current: "", newPw: "", confirm: "" });
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isPending, start]    = useTransition();
  const [success, setSuccess] = useState("");
  const [error, setError]     = useState("");

  function strength(pw) {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8)          s++;
    if (/[A-Z]/.test(pw))        s++;
    if (/[0-9]/.test(pw))        s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  }
  const str = strength(form.newPw);
  const strColors = ["bg-red-400", "bg-orange-400", "bg-amber-400", "bg-emerald-400"];
  const strLabels = ["Weak", "Fair", "Good", "Strong"];

  function handleSubmit(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (form.newPw.length < 8) { setError("New password must be at least 8 characters."); return; }
    if (form.newPw !== form.confirm) { setError("Passwords do not match."); return; }
    start(async () => {
      const res = await changePassword({ currentPassword: form.current, newPassword: form.newPw });
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess(hasPassword
          ? "Password changed successfully."
          : "Password set. You can now sign in with email and password.");
        setForm({ current: "", newPw: "", confirm: "" });
      }
    });
  }

  return (
    <div className="bg-white border border-[#EDE5F0] rounded-2xl p-6 space-y-5">
      <div>
        <h3 className={`${playfair.className} text-[18px] font-semibold text-[#1a1410]`}>
          {hasPassword ? "Change Password" : "Set a Password"}
        </h3>
        <p className={`${montserrat.className} text-[12px] text-[#9B8BAB] mt-0.5`}>
          {hasPassword
            ? "Update your account password. You'll need your current password."
            : "Your account uses Google sign-in. Add a password to also sign in with email."}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {success && (
          <motion.div key="succ" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`${montserrat.className} text-[12px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-xl flex items-center gap-2`}>
            <svg viewBox="0 0 12 12" width="13" height="13" fill="none">
              <circle cx="6" cy="6" r="5.3" stroke="currentColor" strokeWidth="1.2" />
              <path d="M3.5 6l1.8 1.8 3.2-3.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {success}
          </motion.div>
        )}
        {error && (
          <motion.div key="err" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`${montserrat.className} text-[12px] text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-xl`}>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-4">
        {hasPassword && (
          <div>
            <label className={FL}>Current Password</label>
            <div className="relative">
              <input type={showCur ? "text" : "password"} value={form.current}
                onChange={(e) => { setForm((f) => ({ ...f, current: e.target.value })); setError(""); }}
                className={`${FI} pr-10`} placeholder="••••••••" autoComplete="current-password" />
              <button type="button" tabIndex={-1} onClick={() => setShowCur((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C4B3CE] hover:text-[#9B8BAB] transition-colors">
                <EyeIcon open={showCur} />
              </button>
            </div>
          </div>
        )}
        <div>
          <label className={FL}>New Password</label>
          <div className="relative">
            <input type={showNew ? "text" : "password"} value={form.newPw}
              onChange={(e) => { setForm((f) => ({ ...f, newPw: e.target.value })); setError(""); }}
              className={`${FI} pr-10`} placeholder="At least 8 characters" autoComplete="new-password" />
            <button type="button" tabIndex={-1} onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C4B3CE] hover:text-[#9B8BAB] transition-colors">
              <EyeIcon open={showNew} />
            </button>
          </div>
          {form.newPw.length > 0 && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i < str ? strColors[str - 1] : "bg-[#EDE5F0]"}`} />
                ))}
              </div>
              <p className={`${montserrat.className} text-[10px] font-semibold ${strColors[str - 1]?.replace("bg-", "text-") || "text-[#9B8BAB]"}`}>
                {str > 0 ? strLabels[str - 1] : "Too short"}
              </p>
            </div>
          )}
        </div>
        <div>
          <label className={FL}>Confirm New Password</label>
          <input type="password" value={form.confirm}
            onChange={(e) => { setForm((f) => ({ ...f, confirm: e.target.value })); setError(""); }}
            className={`${FI} ${form.confirm && form.confirm !== form.newPw ? "border-red-300 focus:border-red-400" : ""}`}
            placeholder="••••••••" autoComplete="new-password" />
          {form.confirm && form.confirm !== form.newPw && (
            <p className={`${montserrat.className} text-[10.5px] text-red-500 mt-1`}>Passwords do not match.</p>
          )}
        </div>
        <button type="submit"
          disabled={isPending || form.newPw.length < 8 || form.newPw !== form.confirm || (hasPassword && !form.current)}
          className={`${montserrat.className} px-6 py-2.5 rounded-xl bg-[#7A2267] text-white text-[12.5px] font-semibold
            hover:bg-[#8e2878] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200`}>
          {isPending ? "Saving…" : hasPassword ? "Change Password" : "Set Password"}
        </button>
      </form>
    </div>
  );
}

function EyeIcon({ open }) {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
      {!open && <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />}
    </svg>
  );
}

// ─── Crop Modal ───────────────────────────────────────────────────────────────
function CropModal({ file, onClose, onApply, applying }) {
  const CROP = 260;
  const MIN_SCALE = 1;
  const MAX_SCALE = 4;

  const [src, setSrc]         = useState("");
  const [offset, setOffset]   = useState({ x: 0, y: 0 });
  const [scale, setScale]     = useState(1);
  const [imgSize, setImgSize] = useState({ w: CROP, h: CROP });
  const imgRef  = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, origX: 0, origY: 0 });

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleLoad() {
    const img = imgRef.current;
    if (!img) return;
    const { naturalWidth: nw, naturalHeight: nh } = img;
    const aspect = nw / nh;
    // fit shorter side to CROP so circle is always fully covered at scale=1
    const w = aspect >= 1 ? CROP * aspect : CROP;
    const h = aspect >= 1 ? CROP : CROP / aspect;
    setImgSize({ w, h });
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }

  function clamp(ox, oy, s) {
    const maxX = Math.max(0, (imgSize.w * s - CROP) / 2);
    const maxY = Math.max(0, (imgSize.h * s - CROP) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, ox)),
      y: Math.max(-maxY, Math.min(maxY, oy)),
    };
  }

  function onPointerDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, origX: offset.x, origY: offset.y };
  }
  function onPointerMove(e) {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffset(clamp(dragRef.current.origX + dx, dragRef.current.origY + dy, scale));
  }
  function onPointerUp() { dragRef.current.active = false; }

  function handleWheel(e) {
    e.preventDefault();
    const s = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + (e.deltaY > 0 ? -0.12 : 0.12)));
    setScale(s);
    setOffset((o) => clamp(o.x, o.y, s));
  }

  function handleScaleSlider(e) {
    const s = Number(e.target.value);
    setScale(s);
    setOffset((o) => clamp(o.x, o.y, s));
  }

  function handleApply() {
    const img = imgRef.current;
    if (!img) return;
    const OUT = 400;
    const canvas = document.createElement("canvas");
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext("2d");
    // clip to circle
    ctx.beginPath();
    ctx.arc(OUT / 2, OUT / 2, OUT / 2, 0, Math.PI * 2);
    ctx.clip();
    // draw image mapped from crop container coords to canvas coords
    const csf = OUT / CROP;
    const imgLeft = CROP / 2 - (imgSize.w * scale) / 2 + offset.x;
    const imgTop  = CROP / 2 - (imgSize.h * scale) / 2 + offset.y;
    ctx.drawImage(img, imgLeft * csf, imgTop * csf, imgSize.w * scale * csf, imgSize.h * scale * csf);
    canvas.toBlob((blob) => { if (blob) onApply(blob); }, "image/jpeg", 0.92);
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
      <div className={`${montserrat.className} bg-white rounded-2xl shadow-2xl w-full max-w-[340px] overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EDE5F0]">
          <div>
            <h3 className={`${playfair.className} text-[17px] font-semibold text-[#1a1410]`}>Crop Photo</h3>
            <p className="text-[10.5px] text-[#9B8BAB] mt-0.5">Drag or scroll to reposition · use slider to zoom</p>
          </div>
          <button onClick={onClose} disabled={applying}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#aaa] hover:text-[#333] hover:bg-[#f5f5f5] transition-all">
            <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M4 4l12 12M16 4L4 16"/>
            </svg>
          </button>
        </div>

        {/* Crop area */}
        <div className="flex flex-col items-center py-6 px-5 space-y-5">
          <div
            className="relative overflow-hidden rounded-full border-4 border-[#7A2267]/25 cursor-grab active:cursor-grabbing select-none shrink-0 touch-none"
            style={{ width: CROP, height: CROP }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onWheel={handleWheel}
          >
            {src && (
              <img
                ref={imgRef}
                src={src}
                alt="crop preview"
                onLoad={handleLoad}
                draggable={false}
                style={{
                  position: "absolute",
                  width:    imgSize.w * scale,
                  height:   imgSize.h * scale,
                  maxWidth: "none",      // override Tailwind preflight's max-width:100%
                  left:     CROP / 2 - (imgSize.w * scale) / 2 + offset.x,
                  top:      CROP / 2 - (imgSize.h * scale) / 2 + offset.y,
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              />
            )}
            {!src && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-[#EDE5F0] border-t-[#7A2267] animate-spin" />
              </div>
            )}
          </div>

          {/* Zoom slider */}
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] uppercase tracking-[0.14em] text-[#9B8BAB] font-semibold">Zoom</span>
              <span className="text-[9.5px] text-[#9B8BAB] tabular-nums">{scale.toFixed(1)}×</span>
            </div>
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 14 14" width="11" height="11" fill="none" className="text-[#C4B3CE] shrink-0">
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M9.5 9.5l2.5 2.5M6 4v4M4 6h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <input type="range" min={MIN_SCALE} max={MAX_SCALE} step={0.05} value={scale}
                onChange={handleScaleSlider}
                className="flex-1 h-1.5 rounded-full appearance-none bg-[#EDE5F0] cursor-pointer accent-[#7A2267]" />
              <svg viewBox="0 0 14 14" width="14" height="14" fill="none" className="text-[#C4B3CE] shrink-0">
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M9.5 9.5l2.5 2.5M6 4v4M4 6h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-[#EDE5F0]">
          <button onClick={onClose} disabled={applying}
            className="flex-1 py-2.5 rounded-xl border border-[#EDE5F0] text-[12px] font-semibold text-[#9B8BAB] hover:bg-[#F5EDF5] disabled:opacity-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleApply} disabled={applying || !src}
            className="flex-1 py-2.5 rounded-xl bg-[#7A2267] text-white text-[12px] font-semibold hover:bg-[#8e2878] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {applying ? (
              <><div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />Saving…</>
            ) : "Apply Photo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab icons ────────────────────────────────────────────────────────────────
function UserIcon({ size = 14 }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="none">
      <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function BedIcon({ size = 14 }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="none">
      <rect x="1" y="5" width="14" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1 9h14M5 9V5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function LockIcon({ size = 14 }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="none">
      <rect x="2" y="7" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AccountClient({ user, bookings, userId, initialTab = "profile" }) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  // initialTab comes from the server (URL ?tab= param) — no hydration flash
  const [tab, setTab] = useState(initialTab);

  const [form, setForm] = useState({
    name:    user.name    || "",
    phone:   user.phone   || "",
    address: user.address || "",
  });
  const [profileSaved, setProfileSaved]     = useState(false);
  const [profileError, setProfileError]     = useState("");
  const [isPending, startTransition]        = useTransition();
  const [imageUploading, setImageUploading] = useState(false);
  const [previewImage, setPreviewImage]     = useState(user.image || "");
  const [cropFile, setCropFile]             = useState(null);
  const fileInputRef = useRef(null);

  const nightStayBookings = bookings.filter((b) => b.bookingMode !== "day_long");
  const dayLongBookings   = bookings.filter((b) => b.bookingMode === "day_long");

  // 3 tabs only — no invoices tab (invoice button lives on each booking card)
  const TABS = [
    { key: "profile",  label: "Profile",  icon: UserIcon },
    { key: "bookings", label: "Bookings", icon: BedIcon  },
    { key: "security", label: "Security", icon: LockIcon },
  ];

  function handleTabChange(key) {
    setTab(key);
    // Persist in URL so refresh keeps you on the same tab
    router.replace(`/account?tab=${key}`, { scroll: false });
  }

  function handleProfileSave(e) {
    e.preventDefault();
    setProfileError(""); setProfileSaved(false);
    startTransition(async () => {
      try {
        await updateProfile({ userId, name: form.name, phone: form.phone, address: form.address });
        setProfileSaved(true);
      } catch (err) {
        setProfileError(err.message || "Failed to save profile.");
      }
    });
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";   // allow re-selecting the same file
    setCropFile(file);
  }

  async function handleCropApply(blob) {
    setImageUploading(true);
    setProfileError("");
    try {
      const fd = new FormData();
      fd.append("file", new File([blob], "profile.jpg", { type: "image/jpeg" }));
      const res  = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || data.error) {
        setProfileError(data.error || "Failed to upload image.");
        return;
      }
      if (data.url) {
        await updateProfileImage({ userId, imageUrl: data.url });
        setPreviewImage(data.url);
        // refresh the navbar session image without a full page reload
        await updateSession({ image: data.url });
        setCropFile(null);
      }
    } catch {
      setProfileError("Failed to upload image.");
    } finally {
      setImageUploading(false);
    }
  }

  return (
    <div className={`${montserrat.className} space-y-5`}>

      {/* Crop modal */}
      {cropFile && (
        <CropModal
          file={cropFile}
          applying={imageUploading}
          onClose={() => setCropFile(null)}
          onApply={handleCropApply}
        />
      )}

      {/* Tab navigation */}
      <div className="flex gap-1 bg-white border border-[#EDE5F0] rounded-2xl p-1.5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-semibold
                transition-all duration-200 ${
                active
                  ? "bg-[#7A2267] text-white shadow-[0_2px_12px_rgba(122,34,103,0.25)]"
                  : "text-[#9B8BAB] hover:text-[#7A2267] hover:bg-[#F5EDF5]"
              }`}
            >
              <Icon size={13} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">

        {/* ── Profile tab ── */}
        {tab === "profile" && (
          <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="bg-white border border-[#EDE5F0] rounded-2xl p-6 space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-5">
                <div className="relative group shrink-0">
                  {previewImage ? (
                    <img src={previewImage} alt={user.name} className="w-20 h-20 rounded-full object-cover border-2 border-[#7A2267]/30" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-[#7A2267]/10 border-2 border-[#7A2267]/20 flex items-center justify-center">
                      <span className={`${playfair.className} text-[2rem] font-semibold text-[#7A2267]`}>
                        {(user.name || "?")[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imageUploading}
                    className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    {imageUploading ? (
                      <div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    ) : (
                      <svg viewBox="0 0 14 14" width="18" height="18" fill="none">
                        <path d="M7 2v7M4 5l3-3 3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M1 11h12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    )}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={handleFileSelect} />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-[#1C1C1C]">{user.name}</p>
                  <p className="text-[12px] text-[#9B8BAB]">{user.email}</p>
                  {user.hasPassword ? (
                    <span className="inline-block mt-1 text-[9.5px] uppercase tracking-wider font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Password set
                    </span>
                  ) : (
                    <button onClick={() => handleTabChange("security")}
                      className="mt-1 text-[11px] text-[#7A2267] font-semibold hover:underline">
                      + Add password →
                    </button>
                  )}
                </div>
              </div>

              {/* Profile form */}
              <form onSubmit={handleProfileSave} className="space-y-4">
                {profileError && (
                  <p className="text-[12px] text-red-700 bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl">
                    {profileError}
                  </p>
                )}
                <div>
                  <label className={FL}>Full Name *</label>
                  <input className={FI} value={form.name}
                    onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setProfileSaved(false); }}
                    placeholder="Your full name" />
                </div>
                <div>
                  <label className={FL}>Phone</label>
                  <input className={FI} value={form.phone}
                    onChange={(e) => { setForm((f) => ({ ...f, phone: e.target.value })); setProfileSaved(false); }}
                    placeholder="+880 1X XX XX XXXX" />
                </div>
                <div>
                  <label className={FL}>Address</label>
                  <textarea className={`${FI} resize-none`} rows={2} value={form.address}
                    onChange={(e) => { setForm((f) => ({ ...f, address: e.target.value })); setProfileSaved(false); }}
                    placeholder="Your address" />
                </div>
                <div className="flex items-center gap-4">
                  <button type="submit" disabled={isPending}
                    className="px-6 py-2.5 rounded-xl bg-[#7A2267] text-white text-[12.5px] font-semibold hover:bg-[#8e2878] disabled:opacity-50 transition-colors duration-200">
                    {isPending ? "Saving…" : "Save Changes"}
                  </button>
                  {profileSaved && (
                    <span className="text-[12px] text-emerald-600 flex items-center gap-1.5">
                      <svg viewBox="0 0 12 12" width="12" height="12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Saved
                    </span>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* ── Bookings tab ── */}
        {tab === "bookings" && (
          <motion.div key="bookings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="space-y-6">
              {bookings.length === 0 ? (
                <EmptyState message="No bookings yet." linkHref="/booking" linkLabel="Book your first stay →" />
              ) : (
                <>
                  {nightStayBookings.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-[#EDE5F0]" />
                        <span className="text-[10px] uppercase tracking-[0.2em] text-[#9B8BAB] font-bold flex items-center gap-1.5">
                          Night Stay · {nightStayBookings.length}
                        </span>
                        <div className="h-px flex-1 bg-[#EDE5F0]" />
                      </div>
                      {nightStayBookings.map((b) => <BookingCard key={b._id} booking={b} />)}
                    </div>
                  )}
                  {dayLongBookings.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-[#EDE5F0]" />
                        <span className="text-[10px] uppercase tracking-[0.2em] text-[#9B8BAB] font-bold flex items-center gap-1.5">
                          Day Long · {dayLongBookings.length}
                        </span>
                        <div className="h-px flex-1 bg-[#EDE5F0]" />
                      </div>
                      {dayLongBookings.map((b) => <BookingCard key={b._id} booking={b} />)}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Security tab ── */}
        {tab === "security" && (
          <motion.div key="security" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="space-y-4">
              <PasswordSection hasPassword={user.hasPassword} />
              <div className="bg-white border border-[#EDE5F0] rounded-2xl p-5">
                <h4 className="text-[11px] uppercase tracking-[0.15em] text-[#9B8BAB] font-bold mb-3">Sign-in Methods</h4>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-[#F9F5FB]">
                    <svg width="16" height="16" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span className="text-[13px] font-medium text-[#1C1C1C]">Google</span>
                    <span className="ml-auto text-[10px] text-[#9B8BAB]">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-[#F9F5FB]">
                    <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
                      <rect x="2" y="6" width="12" height="9" rx="1.5" stroke="#9B8BAB" strokeWidth="1.3"/>
                      <path d="M5 6V4.5a3 3 0 0 1 6 0V6" stroke="#9B8BAB" strokeWidth="1.3"/>
                    </svg>
                    <span className="text-[13px] font-medium text-[#1C1C1C]">Email & Password</span>
                    <span className={`ml-auto text-[10px] font-semibold ${user.hasPassword ? "text-emerald-600" : "text-[#9B8BAB]"}`}>
                      {user.hasPassword ? "Enabled" : "Not set"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
