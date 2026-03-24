"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import { updateProfile, updateProfileImage } from "@/actions/account/accountActions";

const FI = "w-full bg-white border border-[#E4DAE8] rounded-xl px-4 py-3 text-[13.5px] text-[#1C1C1C] placeholder-[#C4B3CE] focus:outline-none focus:border-[#7A2267]/50 focus:ring-2 focus:ring-[#7A2267]/8 transition-all duration-200";
const FL = "block text-[9.5px] uppercase tracking-[0.14em] text-[#9B8BAB] font-semibold mb-1.5";

const STATUS_COLORS = {
  pending:     { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200" },
  confirmed:   { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200" },
  checked_in:  { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  checked_out: { bg: "bg-slate-50",   text: "text-slate-600",   border: "border-slate-200" },
  cancelled:   { bg: "bg-red-50",     text: "text-red-600",     border: "border-red-200" },
  no_show:     { bg: "bg-orange-50",  text: "text-orange-600",  border: "border-orange-200" },
};

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${c.bg} ${c.text} ${c.border}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function BookingCard({ booking, showInvoiceButton = false }) {
  return (
    <div className="bg-white border border-[#EDE5F0] rounded-2xl p-5 space-y-3 hover:shadow-[0_4px_20px_rgba(122,34,103,0.07)] transition-shadow duration-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] text-[#9B8BAB] font-mono">{booking.bookingNumber}</p>
          <p className="text-[14px] font-semibold text-[#1C1C1C] mt-0.5">{booking.property?.name || "Property"}</p>
          {booking.category && (
            <p className="text-[12px] text-[#9B8BAB]">{booking.category.name}</p>
          )}
          {booking.room && (
            <p className="text-[11.5px] text-[#9B8BAB]">
              Room #{booking.room.roomNumber} · Floor {booking.room.floor}
            </p>
          )}
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="flex items-center gap-4 text-[12px] text-[#9B8BAB] border-t border-[#F3EDF5] pt-3">
        <div>
          <p className="text-[9px] uppercase tracking-[0.12em] font-semibold mb-0.5">Check-in</p>
          <p className="text-[#1C1C1C] font-medium">{fmtDate(booking.checkIn)}</p>
        </div>
        <svg viewBox="0 0 14 6" width="14" height="6" fill="none" className="shrink-0">
          <path d="M1 3h12M9 1l2 2-2 2" stroke="#C4B3CE" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div>
          <p className="text-[9px] uppercase tracking-[0.12em] font-semibold mb-0.5">Check-out</p>
          <p className="text-[#1C1C1C] font-medium">{fmtDate(booking.checkOut)}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-[#9B8BAB] mb-0.5">Total</p>
          <p className="text-[16px] font-bold text-[#7A2267]">৳{(booking.totalAmount || 0).toLocaleString()}</p>
        </div>
      </div>

      {showInvoiceButton && (
        <Link
          href={`/account/invoice/${booking._id}`}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-[#7A2267]/30
            text-[#7A2267] text-[12px] font-semibold hover:bg-[#7A2267]/5 transition-colors duration-200"
        >
          <svg viewBox="0 0 14 14" width="13" height="13" fill="none">
            <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" />
            <path d="M4 5h6M4 7.5h6M4 10h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          View Invoice
        </Link>
      )}
    </div>
  );
}

export default function AccountClient({ user, bookings, userId }) {
  const [tab, setTab] = useState("profile");

  const [form, setForm] = useState({
    name:    user.name    || "",
    phone:   user.phone   || "",
    address: user.address || "",
  });
  const [profileSaved, setProfileSaved]   = useState(false);
  const [profileError, setProfileError]   = useState("");
  const [isPending, startTransition]      = useTransition();
  const [imageUploading, setImageUploading] = useState(false);
  const [previewImage, setPreviewImage]   = useState(user.image || "");
  const fileInputRef = useRef(null);

  const TABS = [
    { key: "profile",  label: "Profile"   },
    { key: "bookings", label: "Bookings"  },
    { key: "invoices", label: "Invoices"  },
  ];

  function handleProfileSave(e) {
    e.preventDefault();
    setProfileError("");
    setProfileSaved(false);
    startTransition(async () => {
      try {
        await updateProfile({ userId, name: form.name, phone: form.phone, address: form.address });
        setProfileSaved(true);
      } catch (err) {
        setProfileError(err.message || "Failed to save profile.");
      }
    });
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) {
        await updateProfileImage({ userId, imageUrl: data.url });
        setPreviewImage(data.url);
      }
    } catch (err) {
      setProfileError("Failed to upload image.");
    } finally {
      setImageUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab nav */}
      <div className="flex gap-1 bg-white border border-[#EDE5F0] rounded-2xl p-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 rounded-xl text-[12.5px] font-semibold transition-all duration-200
              ${tab === t.key
                ? "bg-[#7A2267] text-white shadow-[0_2px_12px_rgba(122,34,103,0.25)]"
                : "text-[#9B8BAB] hover:text-[#7A2267] hover:bg-[#F5EDF5]"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === "profile" && (
        <div className="bg-white border border-[#EDE5F0] rounded-2xl p-6 space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative group">
              {previewImage ? (
                <img src={previewImage} alt={user.name} className="w-20 h-20 rounded-full object-cover border-2 border-[#7A2267]/30" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#7A2267]/10 border-2 border-[#7A2267]/20 flex items-center justify-center">
                  <span className="text-[2rem] font-semibold text-[#7A2267]">
                    {(user.name || "?")[0].toUpperCase()}
                  </span>
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={imageUploading}
                className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40
                  opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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
              <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[#1C1C1C]">{user.name}</p>
              <p className="text-[12px] text-[#9B8BAB]">{user.email}</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] text-[#7A2267] font-semibold mt-1 hover:underline"
              >
                Change photo
              </button>
            </div>
          </div>

          {/* Profile form */}
          <form onSubmit={handleProfileSave} className="space-y-4">
            {profileError && (
              <p className="text-[12px] text-[#7A2267] bg-[#7A2267]/5 border border-[#7A2267]/15 px-4 py-2.5 rounded-xl">
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
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-2.5 rounded-xl bg-[#7A2267] text-white text-[12.5px] font-semibold
                  hover:bg-[#8e2878] disabled:opacity-50 transition-colors duration-200"
              >
                {isPending ? "Saving…" : "Save Changes"}
              </button>
              {profileSaved && (
                <span className="text-[12px] text-emerald-600 flex items-center gap-1.5">
                  <svg viewBox="0 0 12 12" width="12" height="12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Profile saved
                </span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Bookings Tab */}
      {tab === "bookings" && (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="bg-white border border-[#EDE5F0] rounded-2xl p-10 text-center">
              <p className="text-[14px] text-[#9B8BAB]">No bookings yet.</p>
              <Link href="/booking" className="mt-3 inline-block text-[12.5px] text-[#7A2267] font-semibold hover:underline">
                Book your first stay →
              </Link>
            </div>
          ) : (
            bookings.map((b) => <BookingCard key={b._id} booking={b} showInvoiceButton={false} />)
          )}
        </div>
      )}

      {/* Invoices Tab */}
      {tab === "invoices" && (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="bg-white border border-[#EDE5F0] rounded-2xl p-10 text-center">
              <p className="text-[14px] text-[#9B8BAB]">No invoices yet.</p>
            </div>
          ) : (
            bookings.map((b) => <BookingCard key={b._id} booking={b} showInvoiceButton={true} />)
          )}
        </div>
      )}
    </div>
  );
}
