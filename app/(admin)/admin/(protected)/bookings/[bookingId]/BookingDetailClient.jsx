"use client";

import { useState, useTransition } from "react";
import { updateBookingStatus, addAdminNote } from "@/actions/accommodation/bookingActions";

const STATUSES = ["pending", "confirmed", "checked_in", "checked_out", "cancelled", "no_show"];

export default function BookingDetailClient({ booking }) {
  const [status, setStatus] = useState(booking.status);
  const [note, setNote] = useState(booking.adminNotes ?? "");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleStatusChange(newStatus) {
    setError("");
    startTransition(async () => {
      try {
        await updateBookingStatus(booking._id, newStatus);
        setStatus(newStatus);
      } catch (err) {
        setError(err.message || "Failed to update status.");
      }
    });
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
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 space-y-5">
      <h3 className="text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold">Admin Actions</h3>

      {error && (
        <p className="text-[11.5px] text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl">
          {error}
        </p>
      )}

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
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
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
          {saved && <span className="text-[11.5px] text-emerald-400">Saved ✓</span>}
        </div>
      </div>
    </div>
  );
}
