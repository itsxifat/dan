"use client";

import { useState, useTransition } from "react";
import { updateBookingStatus, addAdminNote, recordCheckInPayment } from "@/actions/accommodation/bookingActions";

const STATUSES = ["pending", "confirmed", "checked_in", "checked_out", "cancelled", "no_show"];

const PAYMENT_METHODS = [
  { value: "cash",       label: "Cash" },
  { value: "card",       label: "Card" },
  { value: "bkash",     label: "bKash" },
  { value: "nagad",     label: "Nagad" },
  { value: "bank",      label: "Bank Transfer" },
  { value: "sslcommerz", label: "Online (SSLCommerz)" },
];

export default function BookingDetailClient({ booking }) {
  const [status,  setStatus]  = useState(booking.status);
  const [note,    setNote]    = useState(booking.adminNotes ?? "");
  const [saved,   setSaved]   = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error,   setError]   = useState("");

  // Check-in payment modal state
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkinPaid,      setCheckinPaid]      = useState("");
  const [checkinMethod,    setCheckinMethod]    = useState("cash");
  const [checkinLoading,   setCheckinLoading]   = useState(false);
  const [checkinError,     setCheckinError]     = useState("");

  // Current payment state (may update after check-in payment recorded)
  const [paidAmount,    setPaidAmount]    = useState(booking.paidAmount    ?? 0);
  const [remaining,     setRemaining]     = useState(booking.remainingAmount ?? 0);
  const [paymentStatus, setPaymentStatus] = useState(booking.paymentStatus ?? "unpaid");

  function handleStatusChange(newStatus) {
    setError("");
    // When checking in: open payment modal if there's a remaining balance
    if (newStatus === "checked_in") {
      const due = booking.remainingAmount ?? 0;
      if (due > 0) {
        setCheckinPaid(String(due));
        setShowCheckinModal(true);
        return;
      }
    }
    startTransition(async () => {
      try {
        await updateBookingStatus(booking._id, newStatus);
        setStatus(newStatus);
      } catch (err) {
        setError(err.message || "Failed to update status.");
      }
    });
  }

  async function handleCheckinPayment() {
    setCheckinError("");
    const amount = parseFloat(checkinPaid);
    if (isNaN(amount) || amount < 0) {
      setCheckinError("Enter a valid amount (0 or more).");
      return;
    }
    setCheckinLoading(true);
    try {
      const result = await recordCheckInPayment(booking._id, {
        paidAmount:    amount,
        paymentMethod: checkinMethod,
      });
      setStatus("checked_in");
      setPaidAmount((prev) => prev + amount);
      setRemaining(result.remainingAmount);
      setPaymentStatus(result.paymentStatus);
      setShowCheckinModal(false);
    } catch (err) {
      setCheckinError(err.message || "Failed to record payment.");
    } finally {
      setCheckinLoading(false);
    }
  }

  function handleSaveNote() {
    setSaved(false);
    setError("");
    startTransition(async () => {
      try {
        await addAdminNote(booking._id, note);
        setSaved(true);
      } catch (err) {
        setError(err.message || "Failed to save note.");
      }
    });
  }

  const INPUT = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-[#7A2267]/60 transition-all duration-200";

  return (
    <>
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 space-y-5">
        <h3 className="text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold">Admin Actions</h3>

        {error && (
          <p className="text-[11.5px] text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl">
            {error}
          </p>
        )}

        {/* Live payment summary */}
        <div className="grid grid-cols-3 gap-3 text-[12px]">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5">
            <p className="text-[9px] uppercase tracking-wider text-white/25 font-semibold mb-1">Total</p>
            <p className="text-white/70 font-semibold">৳{booking.totalAmount?.toLocaleString() ?? "–"}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5">
            <p className="text-[9px] uppercase tracking-wider text-white/25 font-semibold mb-1">Paid</p>
            <p className={paidAmount > 0 ? "text-emerald-400 font-semibold" : "text-white/40"}>
              ৳{paidAmount.toLocaleString()}
            </p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5">
            <p className="text-[9px] uppercase tracking-wider text-white/25 font-semibold mb-1">Remaining</p>
            <p className={remaining > 0 ? "text-amber-400 font-semibold" : "text-emerald-400 font-semibold"}>
              {remaining > 0 ? `৳${remaining.toLocaleString()}` : "Cleared"}
            </p>
          </div>
        </div>

        {/* Status */}
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/25 font-semibold mb-2">Update Status</p>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={isPending || status === s}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-medium border capitalize transition-all duration-200 disabled:opacity-50
                  ${status === s
                    ? "bg-[#7A2267]/20 border-[#7A2267]/50 text-[#c05aae]"
                    : "border-white/[0.08] text-white/30 hover:text-white/60 hover:border-white/15"
                  }`}
              >
                {s === "checked_in" && remaining > 0 ? `${s.replace("_", " ")} + collect payment` : s.replace("_", " ")}
              </button>
            ))}
          </div>
          {remaining > 0 && status === "confirmed" && (
            <p className="text-[10.5px] text-amber-400 mt-2">
              ৳{remaining.toLocaleString()} due at check-in — you will be prompted to record payment when checking in.
            </p>
          )}
        </div>

        {/* Admin note */}
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/25 font-semibold mb-2">Admin Notes</p>
          <textarea
            className={`${INPUT} resize-none`}
            rows={3}
            value={note}
            onChange={(e) => { setNote(e.target.value); setSaved(false); }}
            placeholder="Internal notes visible only to staff…"
          />
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={handleSaveNote}
              disabled={isPending}
              className="px-4 py-2 rounded-xl bg-[#7A2267] text-white text-[12px] font-semibold
                hover:bg-[#8e2878] disabled:opacity-50 transition-colors duration-200"
            >
              {isPending ? "Saving…" : "Save Note"}
            </button>
            {saved && <span className="text-[11.5px] text-emerald-400">Saved</span>}
          </div>
        </div>
      </div>

      {/* Check-in Payment Modal */}
      {showCheckinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5">
            <div>
              <h3 className="text-[16px] font-semibold text-white/85 mb-1">Record Check-in Payment</h3>
              <p className="text-[12px] text-white/40">
                Guest is checking in. Record the payment received at desk.
              </p>
            </div>

            {/* Amounts summary */}
            <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-4 space-y-2 text-[12.5px]">
              <div className="flex justify-between text-white/50">
                <span>Total booking amount</span>
                <span>৳{booking.totalAmount?.toLocaleString()}</span>
              </div>
              {paidAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Already paid online</span>
                  <span>৳{paidAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-amber-400 font-semibold border-t border-white/5 pt-2">
                <span>Due now</span>
                <span>৳{remaining.toLocaleString()}</span>
              </div>
            </div>

            {checkinError && (
              <p className="text-[11.5px] text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">
                {checkinError}
              </p>
            )}

            {/* Amount input */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-1.5">
                Amount Collected (৳)
              </label>
              <input
                type="number"
                min="0"
                value={checkinPaid}
                onChange={(e) => setCheckinPaid(e.target.value)}
                className={INPUT}
                placeholder={`e.g. ${remaining}`}
              />
              <p className="text-[10.5px] text-white/25 mt-1">Enter 0 if no payment collected (waived or deferred).</p>
            </div>

            {/* Payment method */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-1.5">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setCheckinMethod(m.value)}
                    className={`py-2 px-2 rounded-xl border text-[11px] font-medium transition-all
                      ${checkinMethod === m.value
                        ? "border-[#7A2267]/60 bg-[#7A2267]/20 text-[#c05aae]"
                        : "border-white/[0.07] text-white/30 hover:text-white/55 hover:border-white/15"
                      }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowCheckinModal(false)}
                disabled={checkinLoading}
                className="flex-1 py-3 rounded-xl border border-white/[0.08] text-white/40 text-[12.5px]
                  hover:text-white/65 hover:border-white/15 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckinPayment}
                disabled={checkinLoading}
                className="flex-[2] py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12.5px]
                  font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {checkinLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Recording…
                  </>
                ) : (
                  "Confirm Check-in & Record Payment"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
