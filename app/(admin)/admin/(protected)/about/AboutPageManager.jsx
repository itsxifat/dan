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

  function set(key) {
    return (e) => { setSaved(false); setForm((f) => ({ ...f, [key]: e.target.value })); };
  }

  function handleSave(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    startTransition(async () => {
      try {
        await updateAboutPage(form);
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

    </form>
  );
}
