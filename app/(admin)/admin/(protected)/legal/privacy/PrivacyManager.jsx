"use client";

import { useState, useTransition } from "react";
import { updateLegalDocument } from "@/actions/legal/legalActions";

const INPUT    = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-[#7A2267]/60 transition-all duration-200";
const TEXTAREA = `${INPUT} resize-none`;
const LABEL    = "block text-[10px] uppercase tracking-wider text-white/35 font-semibold mb-1.5";
const CARD     = "bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 sm:p-6 space-y-4";
const SECT     = "text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold";

function SectionCard({ section, index, total, onChange, onRemove, onMoveUp, onMoveDown }) {
  return (
    <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-lg bg-[#7A2267]/15 border border-[#7A2267]/20
            flex items-center justify-center text-[9px] font-bold text-[#c05aae]">
            {index + 1}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-white/25 font-semibold">
            Section {index + 1}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" disabled={index === 0}
            onClick={onMoveUp}
            className="p-1.5 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/[0.05]
              transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed">
            <svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M7 11V3M3 7l4-4 4 4" />
            </svg>
          </button>
          <button type="button" disabled={index === total - 1}
            onClick={onMoveDown}
            className="p-1.5 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/[0.05]
              transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed">
            <svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M7 3v8M3 7l4 4 4-4" />
            </svg>
          </button>
          <button type="button" onClick={onRemove}
            className="p-1.5 rounded-lg text-white/15 hover:text-red-400 hover:bg-red-500/10
              transition-all duration-150 ml-1">
            <svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M2 4h10M5 4V3h4v1M5.5 6.5v4M8.5 6.5v4M3 4l.7 7h6.6L11 4" />
            </svg>
          </button>
        </div>
      </div>

      <div>
        <label className={LABEL}>Section Title</label>
        <input
          className={INPUT}
          value={section.title}
          onChange={(e) => onChange({ ...section, title: e.target.value })}
          placeholder="e.g. Information We Collect"
        />
      </div>

      <div>
        <label className={LABEL}>Content</label>
        <textarea
          className={TEXTAREA}
          rows={5}
          value={section.content}
          onChange={(e) => onChange({ ...section, content: e.target.value })}
          placeholder="Write the section content here…"
        />
      </div>
    </div>
  );
}

export default function PrivacyManager({ data }) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title:         data.title         ?? "Privacy Policy",
    effectiveDate: data.effectiveDate ?? "",
    intro:         data.intro         ?? "",
    sections:      data.sections      ?? [],
  });

  function set(key) {
    return (e) => {
      setSaved(false);
      setForm((f) => ({ ...f, [key]: e.target.value }));
    };
  }

  function addSection() {
    setSaved(false);
    setForm((f) => ({
      ...f,
      sections: [...f.sections, { title: "", content: "" }],
    }));
  }

  function updateSection(idx, val) {
    setSaved(false);
    setForm((f) => {
      const secs = [...f.sections];
      secs[idx] = val;
      return { ...f, sections: secs };
    });
  }

  function removeSection(idx) {
    setSaved(false);
    setForm((f) => ({
      ...f,
      sections: f.sections.filter((_, i) => i !== idx),
    }));
  }

  function moveSection(idx, dir) {
    setSaved(false);
    setForm((f) => {
      const secs = [...f.sections];
      const target = idx + dir;
      if (target < 0 || target >= secs.length) return f;
      [secs[idx], secs[target]] = [secs[target], secs[idx]];
      return { ...f, sections: secs };
    });
  }

  function handleSave(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    startTransition(async () => {
      try {
        await updateLegalDocument("privacy", form);
        setSaved(true);
      } catch (err) {
        setError(err.message || "Failed to save.");
      }
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">

      {/* ── Status bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        {saved && (
          <span className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20
            px-3 py-1.5 rounded-full">
            Saved successfully
          </span>
        )}
        {error && (
          <span className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20
            px-3 py-1.5 rounded-full">
            {error}
          </span>
        )}
        <a
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-medium text-white/30 hover:text-white/60
            flex items-center gap-1.5 transition-colors duration-200"
        >
          <svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <path d="M6 2H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8M8 2h4v4M12 2L6.5 7.5" />
          </svg>
          Preview
        </a>
        <button
          type="submit"
          disabled={isPending}
          className="ml-auto text-[11px] font-semibold uppercase tracking-wider
            px-5 py-2.5 rounded-full bg-[#7A2267] text-white
            hover:bg-[#8a256f] transition-all duration-200 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Publish Changes"}
        </button>
      </div>

      {/* ── Document settings ───────────────────────────────────────────── */}
      <div className={CARD}>
        <h3 className={SECT}>Document Settings</h3>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Document Title</label>
            <input className={INPUT} value={form.title} onChange={set("title")}
              placeholder="Privacy Policy" />
          </div>
          <div>
            <label className={LABEL}>Effective Date</label>
            <input className={INPUT} value={form.effectiveDate} onChange={set("effectiveDate")}
              placeholder="e.g. January 1, 2025" />
          </div>
        </div>

        <div>
          <label className={LABEL}>Introduction Paragraph</label>
          <textarea className={TEXTAREA} rows={4}
            value={form.intro} onChange={set("intro")}
            placeholder="A brief introduction about your data practices…" />
          <p className="mt-1.5 text-[10px] text-white/25">
            Shown at the top of the Privacy Policy page before all sections.
          </p>
        </div>
      </div>

      {/* ── Sections ────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-[13px] font-semibold text-white/80">Policy Sections</h3>
            <p className="text-[11px] text-white/30 mt-0.5">
              {form.sections.length} section{form.sections.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={addSection}
            className="flex items-center gap-2 text-[11px] font-semibold
              px-4 py-2 rounded-xl border border-white/[0.1] text-white/50
              hover:bg-white/[0.05] hover:text-white/80 hover:border-white/[0.15]
              transition-all duration-200"
          >
            <svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M7 1v12M1 7h12" />
            </svg>
            Add Section
          </button>
        </div>

        {form.sections.length === 0 && (
          <div className="bg-white/[0.02] border border-dashed border-white/[0.08] rounded-2xl
            p-10 text-center">
            <p className="text-[12px] text-white/25 mb-3">No sections yet.</p>
            <button type="button" onClick={addSection}
              className="text-[11px] font-semibold text-[#c05aae] hover:text-[#e08ad0]
                transition-colors duration-200">
              + Add your first policy section
            </button>
          </div>
        )}

        <div className="space-y-3">
          {form.sections.map((sec, i) => (
            <SectionCard
              key={i}
              section={sec}
              index={i}
              total={form.sections.length}
              onChange={(val) => updateSection(i, val)}
              onRemove={() => removeSection(i)}
              onMoveUp={() => moveSection(i, -1)}
              onMoveDown={() => moveSection(i, 1)}
            />
          ))}
        </div>

        {form.sections.length > 0 && (
          <button
            type="button"
            onClick={addSection}
            className="w-full py-3 rounded-xl border border-dashed border-white/[0.08]
              text-[11px] text-white/25 hover:text-white/50 hover:border-white/[0.14]
              hover:bg-white/[0.02] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 14 14" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M7 1v12M1 7h12" />
            </svg>
            Add another section
          </button>
        )}
      </div>

    </form>
  );
}
