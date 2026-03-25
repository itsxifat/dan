"use client";

import { useState, useTransition } from "react";
import { updateSettings } from "@/actions/accommodation/settingsActions";

const INPUT = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-[#7A2267]/60 transition-all duration-200";
const LABEL = "block text-[10px] uppercase tracking-wider text-white/35 font-semibold mb-1.5";

export default function SettingsForm({ settings }) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    maxFreeChildAge:       settings.maxFreeChildAge        ?? 5,
    maxChildrenPerRoom:    settings.maxChildrenPerRoom     ?? 2,
    maxGuestsPerRoom:      settings.maxGuestsPerRoom       ?? 4,
    requireCoupleDoc:      settings.requireCoupleDoc       ?? true,
    checkInTime:           settings.checkInTime            ?? "14:00",
    checkOutTime:          settings.checkOutTime           ?? "11:00",
    dayLongCheckInTime:    settings.dayLongCheckInTime     ?? "09:00",
    dayLongCheckOutTime:   settings.dayLongCheckOutTime    ?? "18:00",
    currency:              settings.currency               ?? "BDT",
    taxPercent:            settings.taxPercent             ?? 0,
    advancePaymentPercent: settings.advancePaymentPercent  ?? 30,
    cancellationPolicy:    settings.cancellationPolicy     ?? "",
  });

  const set = (key) => (e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setSaved(false); };
  const setNum = (key) => (e) => { setForm((f) => ({ ...f, [key]: Number(e.target.value) })); setSaved(false); };
  const setBool = (key) => (e) => { setForm((f) => ({ ...f, [key]: e.target.checked })); setSaved(false); };

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    startTransition(async () => {
      try {
        await updateSettings({
          ...form,
          maxFreeChildAge:       Number(form.maxFreeChildAge),
          maxChildrenPerRoom:    Number(form.maxChildrenPerRoom),
          maxGuestsPerRoom:      Number(form.maxGuestsPerRoom),
          taxPercent:            Number(form.taxPercent),
          advancePaymentPercent: Number(form.advancePaymentPercent),
        });
        setSaved(true);
      } catch (err) {
        setError(err.message || "Failed to save settings.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {error && (
        <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-[12px] px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Guest Policy */}
      <div className="bg-white/2 border border-white/6 rounded-2xl p-6 space-y-5">
        <h3 className="text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold">Guest Policy</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={LABEL}>Max Free Child Age</label>
            <input type="number" className={INPUT} value={form.maxFreeChildAge}
              onChange={setNum("maxFreeChildAge")} min="0" max="18" />
            <p className="mt-1 text-[10px] text-white/20">Children at or below this age are classified as "child" guests.</p>
          </div>
          <div>
            <label className={LABEL}>Max Children Per Room</label>
            <input type="number" className={INPUT} value={form.maxChildrenPerRoom}
              onChange={setNum("maxChildrenPerRoom")} min="0" />
          </div>
          <div>
            <label className={LABEL}>Max Guests Per Room</label>
            <input type="number" className={INPUT} value={form.maxGuestsPerRoom}
              onChange={setNum("maxGuestsPerRoom")} min="1" />
          </div>

          <div className="sm:col-span-2">
            <label className="flex items-center gap-4 cursor-pointer">
              <div className="relative shrink-0">
                <input type="checkbox" className="sr-only" checked={form.requireCoupleDoc} onChange={setBool("requireCoupleDoc")} />
                <div className={`w-10 h-5 rounded-full transition-colors duration-200 ${form.requireCoupleDoc ? "bg-[#7A2267]" : "bg-white/10"}`} />
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${form.requireCoupleDoc ? "translate-x-5" : "translate-x-0"}`} />
              </div>
              <div>
                <p className="text-[12px] font-medium text-white/70">Require Couple Document</p>
                <p className="text-[10px] text-white/25">Unmarried couples must submit a certificate during booking.</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Check-in / Check-out Times */}
      <div className="bg-white/2 border border-white/6 rounded-2xl p-6 space-y-5">
        <h3 className="text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold">Times & Currency</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={LABEL}>Night Stay — Check-in Time</label>
            <input type="time" className={INPUT} value={form.checkInTime} onChange={set("checkInTime")} />
          </div>
          <div>
            <label className={LABEL}>Night Stay — Check-out Time</label>
            <input type="time" className={INPUT} value={form.checkOutTime} onChange={set("checkOutTime")} />
          </div>
          <div>
            <label className={LABEL}>Day Long — Check-in Time</label>
            <input type="time" className={INPUT} value={form.dayLongCheckInTime} onChange={set("dayLongCheckInTime")} />
          </div>
          <div>
            <label className={LABEL}>Day Long — Check-out Time</label>
            <input type="time" className={INPUT} value={form.dayLongCheckOutTime} onChange={set("dayLongCheckOutTime")} />
          </div>
          <div>
            <label className={LABEL}>Currency</label>
            <input className={INPUT} value={form.currency} onChange={set("currency")} placeholder="BDT" />
          </div>
          <div>
            <label className={LABEL}>Tax (%)</label>
            <input type="number" className={INPUT} value={form.taxPercent}
              onChange={setNum("taxPercent")} min="0" max="100" step="0.01" />
            <p className="mt-1 text-[10px] text-white/20">Applied on top of the base price. Set to 0 for no tax.</p>
          </div>
          <div>
            <label className={LABEL}>Advance Payment (%)</label>
            <input type="number" className={INPUT} value={form.advancePaymentPercent}
              onChange={setNum("advancePaymentPercent")} min="0" max="100" />
            <p className="mt-1 text-[10px] text-white/20">Percentage of total charged as online advance. Remaining paid at check-in.</p>
          </div>
        </div>
      </div>

      {/* Cancellation Policy */}
      <div className="bg-white/2 border border-white/6 rounded-2xl p-6 space-y-4">
        <h3 className="text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold">Cancellation Policy</h3>
        <textarea
          className={`${INPUT} resize-none`}
          rows={4}
          value={form.cancellationPolicy}
          onChange={set("cancellationPolicy")}
          placeholder="Describe your cancellation policy shown to guests…"
        />
      </div>

      <div className="flex items-center gap-4 pb-8">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 rounded-xl bg-[#7A2267] text-white text-[12.5px] font-semibold
            hover:bg-[#8e2878] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isPending ? "Saving…" : "Save Settings"}
        </button>
        {saved && (
          <span className="text-[12px] text-emerald-400 flex items-center gap-1.5">
            <svg viewBox="0 0 12 12" width="12" height="12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Settings saved
          </span>
        )}
      </div>
    </form>
  );
}
