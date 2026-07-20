"use client";

import { useState, useTransition } from "react";
import ImageUpload from "@/components/ui/ImageUpload";
import { updateAboutPage } from "@/actions/about/aboutActions";

const INPUT    = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-[#7A2267]/60 transition-all duration-200";
const TEXTAREA = `${INPUT} resize-none`;
const LABEL    = "block text-[10px] uppercase tracking-wider text-white/35 font-semibold mb-1.5";
const CARD     = "bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 space-y-5";
const SECT     = "text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold";

export default function AboutPageManager({ data }) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    chairmanName:         data.chairmanName         ?? "",
    chairmanTitle:        data.chairmanTitle         ?? "",
    chairmanOrganization: data.chairmanOrganization  ?? "",
    chairmanImage:        data.chairmanImage         ?? "",
    chairmanQuote:        data.chairmanQuote         ?? "",
    chairmanMessagePara1: data.chairmanMessagePara1  ?? "",
    chairmanMessagePara2: data.chairmanMessagePara2  ?? "",
  });

  const [executives, setExecutives] = useState(() =>
    (data.executives ?? []).map((m) => ({
      name:  m.name  ?? "",
      role:  m.role  ?? "",
      image: m.image ?? "",
    }))
  );

  function set(key) {
    return (e) => { setSaved(false); setForm((f) => ({ ...f, [key]: e.target.value })); };
  }

  // ── Executive panel row helpers ────────────────────────────────────────────
  function setExec(i, key, value) {
    setSaved(false);
    setExecutives((prev) => prev.map((m, idx) => (idx === i ? { ...m, [key]: value } : m)));
  }
  function addExec() {
    setSaved(false);
    setExecutives((prev) => [...prev, { name: "", role: "", image: "" }]);
  }
  function removeExec(i) {
    setSaved(false);
    setExecutives((prev) => prev.filter((_, idx) => idx !== i));
  }
  function moveExec(i, dir) {
    const j = i + dir;
    setSaved(false);
    setExecutives((prev) => {
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function handleSave(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    startTransition(async () => {
      try {
        await updateAboutPage({ ...form, executives });
        setSaved(true);
      } catch (err) {
        setError(err.message || "Failed to save.");
      }
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-3xl">

      {/* Status */}
      <div className="flex items-center gap-3 flex-wrap">
        {saved && (
          <span className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
            Saved successfully
          </span>
        )}
        {error && (
          <span className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full">
            {error}
          </span>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="ml-auto text-[11px] font-semibold uppercase tracking-wider px-5 py-2.5 rounded-full
            bg-[#7A2267] text-white hover:bg-[#8a256f] transition-all duration-200 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {/* Chairman identity */}
      <div className={CARD}>
        <h3 className={SECT}>Chairman Identity</h3>

        <div>
          <label className={LABEL}>Photo</label>
          <ImageUpload
            value={form.chairmanImage}
            onChange={(url) => { setSaved(false); setForm((f) => ({ ...f, chairmanImage: url })); }}
          />
          <p className="mt-1.5 text-[10px] text-white/25">
            Upload via Admin → Media first, then pick here. Use a portrait-style photo.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <label className={LABEL}>Full Name</label>
            <input className={INPUT} value={form.chairmanName} onChange={set("chairmanName")}
              placeholder="Md. Abdur Rahman Dhali" />
          </div>
          <div>
            <label className={LABEL}>Title / Role</label>
            <input className={INPUT} value={form.chairmanTitle} onChange={set("chairmanTitle")}
              placeholder="Chairman" />
          </div>
          <div>
            <label className={LABEL}>Organization</label>
            <input className={INPUT} value={form.chairmanOrganization} onChange={set("chairmanOrganization")}
              placeholder="Dhali's Amber Nivaas Resort" />
          </div>
        </div>
      </div>

      {/* Chairman message */}
      <div className={CARD}>
        <h3 className={SECT}>Message Content</h3>

        <div>
          <label className={LABEL}>Main Quote (italic, large)</label>
          <textarea
            className={TEXTAREA} rows={4}
            value={form.chairmanQuote}
            onChange={set("chairmanQuote")}
            placeholder="When we built Amber Nivaas, we did not simply wish to build a resort…"
          />
          <p className="mt-1.5 text-[10px] text-white/25">
            Displayed in large italic text as the primary statement.
          </p>
        </div>

        <div>
          <label className={LABEL}>First Paragraph</label>
          <textarea
            className={TEXTAREA} rows={3}
            value={form.chairmanMessagePara1}
            onChange={set("chairmanMessagePara1")}
            placeholder="Every corner of this resort carries a promise…"
          />
        </div>

        <div>
          <label className={LABEL}>Second Paragraph</label>
          <textarea
            className={TEXTAREA} rows={3}
            value={form.chairmanMessagePara2}
            onChange={set("chairmanMessagePara2")}
            placeholder="Our commitment to halal standards…"
          />
        </div>
      </div>

      {/* Executive panel */}
      <div className={CARD}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className={SECT}>Executive Panel</h3>
            <p className="mt-1.5 text-[10px] text-white/25">
              Shown as a card grid on the About page, in the order listed here.
              Members with no name, role, or photo are dropped on save.
            </p>
          </div>
          <button
            type="button"
            onClick={addExec}
            className="shrink-0 text-[11px] font-semibold px-4 py-2 rounded-full
              bg-white/[0.06] border border-white/[0.08] text-white/70
              hover:bg-[#7A2267] hover:border-[#7A2267] hover:text-white
              transition-colors duration-200"
          >
            + Add Member
          </button>
        </div>

        {executives.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/[0.08] px-4 py-8 text-center">
            <p className="text-[12px] text-white/30">No executive members yet.</p>
            <p className="mt-1 text-[10.5px] text-white/20">
              Add members to show the Executive Panel section on the About page.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {executives.map((m, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4
                  grid gap-4 sm:grid-cols-[140px_1fr_auto] items-start"
              >
                {/* Photo */}
                <div>
                  <label className={LABEL}>Photo</label>
                  <ImageUpload
                    value={m.image}
                    onChange={(url) => setExec(i, "image", url)}
                  />
                </div>

                {/* Name + role */}
                <div className="space-y-3">
                  <div>
                    <label className={LABEL}>Full Name</label>
                    <input
                      className={INPUT}
                      value={m.name}
                      onChange={(e) => setExec(i, "name", e.target.value)}
                      placeholder="e.g. Md. Abdur Rahman Dhali"
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Title / Role</label>
                    <input
                      className={INPUT}
                      value={m.role}
                      onChange={(e) => setExec(i, "role", e.target.value)}
                      placeholder="e.g. Managing Director"
                    />
                  </div>
                </div>

                {/* Reorder + remove */}
                <div className="flex sm:flex-col gap-1.5 sm:pt-6">
                  <button
                    type="button"
                    onClick={() => moveExec(i, -1)}
                    disabled={i === 0}
                    aria-label="Move up"
                    className="w-8 h-8 rounded-lg border border-white/[0.08] text-white/40
                      hover:text-white hover:border-white/20 transition-colors duration-200
                      disabled:opacity-25 disabled:pointer-events-none text-[12px]"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveExec(i, 1)}
                    disabled={i === executives.length - 1}
                    aria-label="Move down"
                    className="w-8 h-8 rounded-lg border border-white/[0.08] text-white/40
                      hover:text-white hover:border-white/20 transition-colors duration-200
                      disabled:opacity-25 disabled:pointer-events-none text-[12px]"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeExec(i)}
                    aria-label="Remove member"
                    className="w-8 h-8 rounded-lg border border-white/[0.08] text-white/40
                      hover:text-red-400 hover:border-red-500/40 transition-colors duration-200 text-[13px]"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </form>
  );
}
