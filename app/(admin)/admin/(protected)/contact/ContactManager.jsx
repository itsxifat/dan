"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import {
  updateContactInfo,
  updateMessageStatus,
  deleteContactMessage,
  getContactMessages,
  replyToContactMessage,
} from "@/actions/contact/contactActions";

// ── shared input styles ────────────────────────────────────────────────────────
const INPUT  = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-[#7A2267]/60 transition-all duration-200";
const LABEL  = "block text-[10px] uppercase tracking-wider text-white/35 font-semibold mb-1.5";
const CARD   = "bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 space-y-5";
const SECT   = "text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold";

// ── small helpers ──────────────────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange }) {
  return (
    <div onClick={() => onChange(!checked)}
      className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 cursor-pointer flex-shrink-0
        ${checked ? "bg-[#7A2267]" : "bg-white/10"}`}>
      <span className={`absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform duration-200
        ${checked ? "translate-x-[18px]" : "translate-x-0"}`} />
    </div>
  );
}

const STATUS_COLOR = {
  new:     "bg-[#7A2267]/20 text-[#c05aae] border-[#7A2267]/30",
  read:    "bg-white/[0.05] text-white/40 border-white/[0.08]",
  replied: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

// ── tab bar ────────────────────────────────────────────────────────────────────
const TABS = [
  { key: "info",      label: "Contact Info" },
  { key: "map",       label: "Map & Location" },
  { key: "directions",label: "Directions" },
  { key: "messages",  label: "Messages" },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function ContactManager({ info, initialMessages, totalMessages, mapsApiKey }) {
  const [tab, setTab] = useState("info");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const [msgFilter, setMsgFilter] = useState("all");
  const [newCount, setNewCount]   = useState(messages.filter((m) => m.status === "new").length);

  // ── poll for new messages every 30s when Messages tab is active ────────────
  useEffect(() => {
    if (tab !== "messages") return;
    const id = setInterval(async () => {
      try {
        const { messages: fresh } = await getContactMessages({ limit: 50 });
        setMessages(fresh);
        setNewCount(fresh.filter((m) => m.status === "new").length);
      } catch { /* silent */ }
    }, 30_000);
    return () => clearInterval(id);
  }, [tab]);

  // ── form state built from DB info ──────────────────────────────────────────
  const [form, setForm] = useState({
    addressLine1:     info.addressLine1     ?? "",
    addressLine2:     info.addressLine2     ?? "",
    addressNote:      info.addressNote      ?? "",
    phones:           info.phones?.length   ? info.phones   : [{ number: "", label: "" }],
    phoneHours:       info.phoneHours       ?? "",
    emails:           info.emails?.length   ? info.emails   : [{ address: "", label: "" }],
    emailNote:        info.emailNote        ?? "",
    checkInTime:      info.checkInTime      ?? "",
    checkOutTime:     info.checkOutTime     ?? "",
    frontDeskHours:   info.frontDeskHours   ?? "",
    reservationPhone: info.reservationPhone ?? "",
    eventsPhone:      info.eventsPhone      ?? "",
    sidebarEmail:     info.sidebarEmail     ?? "",
    directions:       info.directions?.length ? info.directions : [{ label: "", desc: "" }],
    mapEmbedMode:     info.mapEmbedMode     ?? "unofficial",
    mapEmbedUrl:      info.mapEmbedUrl      ?? "",
    mapLat:           info.mapLat           ?? "",
    mapLng:           info.mapLng           ?? "",
    contactFormEmail: info.contactFormEmail ?? "",
  });

  function set(key) {
    return (e) => { setSaved(false); setForm((f) => ({ ...f, [key]: e.target.value })); };
  }

  // ── phones ─────────────────────────────────────────────────────────────────
  function setPhone(i, field, val) {
    setSaved(false);
    setForm((f) => {
      const phones = f.phones.map((p, idx) => idx === i ? { ...p, [field]: val } : p);
      return { ...f, phones };
    });
  }
  function addPhone() {
    setForm((f) => ({ ...f, phones: [...f.phones, { number: "", label: "" }] }));
  }
  function removePhone(i) {
    setForm((f) => ({ ...f, phones: f.phones.filter((_, idx) => idx !== i) }));
  }

  // ── emails ─────────────────────────────────────────────────────────────────
  function setEmailItem(i, field, val) {
    setSaved(false);
    setForm((f) => {
      const emails = f.emails.map((e, idx) => idx === i ? { ...e, [field]: val } : e);
      return { ...f, emails };
    });
  }
  function addEmail() {
    setForm((f) => ({ ...f, emails: [...f.emails, { address: "", label: "" }] }));
  }
  function removeEmail(i) {
    setForm((f) => ({ ...f, emails: f.emails.filter((_, idx) => idx !== i) }));
  }

  // ── directions ─────────────────────────────────────────────────────────────
  function setDir(i, field, val) {
    setSaved(false);
    setForm((f) => {
      const directions = f.directions.map((d, idx) => idx === i ? { ...d, [field]: val } : d);
      return { ...f, directions };
    });
  }
  function addDir() {
    setForm((f) => ({ ...f, directions: [...f.directions, { label: "", desc: "" }] }));
  }
  function removeDir(i) {
    setForm((f) => ({ ...f, directions: f.directions.filter((_, idx) => idx !== i) }));
  }

  // ── save ───────────────────────────────────────────────────────────────────
  function handleSave(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    startTransition(async () => {
      try {
        await updateContactInfo({
          ...form,
          mapLat: Number(form.mapLat) || 0,
          mapLng: Number(form.mapLng) || 0,
        });
        setSaved(true);
      } catch (err) {
        setError(err.message || "Failed to save.");
      }
    });
  }

  // ── reply state: { [id]: { open, text, sending, error } } ─────────────────
  const [replyState, setReplyState] = useState({});

  function setReply(id, patch) {
    setReplyState((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function toggleReply(id) {
    setReplyState((prev) => ({
      ...prev,
      [id]: { open: !prev[id]?.open, text: prev[id]?.text ?? "", sending: false, error: "" },
    }));
  }

  async function handleSendReply(id) {
    const text = replyState[id]?.text ?? "";
    if (!text.trim()) { setReply(id, { error: "Reply cannot be empty." }); return; }
    setReply(id, { sending: true, error: "" });
    try {
      await replyToContactMessage(id, text);
      setMessages((prev) => {
        const now = new Date().toISOString();
        const next = prev.map((m) => m._id === id ? { ...m, status: "replied", reply: text, repliedAt: now } : m);
        setNewCount(next.filter((m) => m.status === "new").length);
        return next;
      });
      setReply(id, { open: false, sending: false, text: "" });
    } catch (err) {
      setReply(id, { sending: false, error: err.message || "Failed to send." });
    }
  }

  // ── message actions ────────────────────────────────────────────────────────
  function handleStatusChange(id, status) {
    startTransition(async () => {
      await updateMessageStatus(id, status);
      setMessages((prev) => {
        const next = prev.map((m) => m._id === id ? { ...m, status } : m);
        setNewCount(next.filter((m) => m.status === "new").length);
        return next;
      });
    });
  }
  function handleDeleteMessage(id) {
    if (!confirm("Delete this message?")) return;
    startTransition(async () => {
      await deleteContactMessage(id);
      setMessages((prev) => {
        const next = prev.filter((m) => m._id !== id);
        setNewCount(next.filter((m) => m.status === "new").length);
        return next;
      });
    });
  }

  const filteredMessages = msgFilter === "all"
    ? messages
    : messages.filter((m) => m.status === msgFilter);

  // ── embed URL builder ─────────────────────────────────────────────────────
  function buildEmbedUrl() {
    if (form.mapEmbedUrl) return form.mapEmbedUrl;
    if (!form.mapLat || !form.mapLng) return null;
    if (form.mapEmbedMode === "official") {
      if (!mapsApiKey) return null;
      return `https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=${form.mapLat},${form.mapLng}&zoom=15`;
    }
    return `https://maps.google.com/maps?q=${form.mapLat},${form.mapLng}&z=15&output=embed`;
  }
  const embedSrc    = buildEmbedUrl();
  const mapsOpenUrl = form.mapLat && form.mapLng
    ? `https://www.google.com/maps?q=${form.mapLat},${form.mapLng}`
    : null;

  return (
    <form onSubmit={handleSave} className="space-y-6">

      {/* ── Save bar ──────────────────────────────────────────────────────── */}
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

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 text-[11px] font-semibold uppercase tracking-wider py-2.5 rounded-xl transition-all duration-200
              ${tab === t.key
                ? "bg-[#7A2267] text-white"
                : "text-white/35 hover:text-white/60"}`}
          >
            {t.label}
            {t.key === "messages" && newCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/20 text-[9px]">
                {newCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB: Contact Info                                                    */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {tab === "info" && (
        <div className="space-y-6">

          {/* Visit Us */}
          <div className={CARD}>
            <h3 className={SECT}>Visit Us</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Address Line 1</label>
                <input className={INPUT} value={form.addressLine1} onChange={set("addressLine1")} placeholder="Savar, Dhaka" />
              </div>
              <div>
                <label className={LABEL}>Address Line 2</label>
                <input className={INPUT} value={form.addressLine2} onChange={set("addressLine2")} placeholder="Bangladesh" />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL}>Sub-note</label>
                <input className={INPUT} value={form.addressNote} onChange={set("addressNote")} placeholder="Approx. 1 hr from Dhaka city" />
              </div>
            </div>
          </div>

          {/* Call Us */}
          <div className={CARD}>
            <h3 className={SECT}>Call Us</h3>
            <div className="space-y-3">
              {form.phones.map((p, i) => (
                <div key={i} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className={LABEL}>Phone {i + 1}</label>
                    <input className={INPUT} value={p.number} onChange={(e) => setPhone(i, "number", e.target.value)} placeholder="+880 1XXX-XXXXXX" />
                  </div>
                  <div className="w-40">
                    <label className={LABEL}>Label (optional)</label>
                    <input className={INPUT} value={p.label} onChange={(e) => setPhone(i, "label", e.target.value)} placeholder="e.g. Reservations" />
                  </div>
                  {form.phones.length > 1 && (
                    <button type="button" onClick={() => removePhone(i)}
                      className="mb-0.5 text-red-400/60 hover:text-red-400 transition-colors text-[18px] leading-none px-1">×</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addPhone}
                className="text-[11px] text-[#7A2267]/70 hover:text-[#7A2267] transition-colors font-semibold">
                + Add phone
              </button>
            </div>
            <div>
              <label className={LABEL}>Hours note</label>
              <input className={INPUT} value={form.phoneHours} onChange={set("phoneHours")} placeholder="Daily 8:00 AM – 10:00 PM" />
            </div>
          </div>

          {/* Email Us */}
          <div className={CARD}>
            <h3 className={SECT}>Email Us</h3>
            <div className="space-y-3">
              {form.emails.map((em, i) => (
                <div key={i} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className={LABEL}>Email {i + 1}</label>
                    <input type="email" className={INPUT} value={em.address} onChange={(e) => setEmailItem(i, "address", e.target.value)} placeholder="hello@ambernivaas.com" />
                  </div>
                  <div className="w-40">
                    <label className={LABEL}>Label (optional)</label>
                    <input className={INPUT} value={em.label} onChange={(e) => setEmailItem(i, "label", e.target.value)} placeholder="e.g. Bookings" />
                  </div>
                  {form.emails.length > 1 && (
                    <button type="button" onClick={() => removeEmail(i)}
                      className="mb-0.5 text-red-400/60 hover:text-red-400 transition-colors text-[18px] leading-none px-1">×</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addEmail}
                className="text-[11px] text-[#7A2267]/70 hover:text-[#7A2267] transition-colors font-semibold">
                + Add email
              </button>
            </div>
            <div>
              <label className={LABEL}>Response note</label>
              <input className={INPUT} value={form.emailNote} onChange={set("emailNote")} placeholder="We reply within 24 hours" />
            </div>
          </div>

          {/* Hours */}
          <div className={CARD}>
            <h3 className={SECT}>Hours</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className={LABEL}>Check-in</label>
                <input className={INPUT} value={form.checkInTime} onChange={set("checkInTime")} placeholder="2:00 PM" />
              </div>
              <div>
                <label className={LABEL}>Check-out</label>
                <input className={INPUT} value={form.checkOutTime} onChange={set("checkOutTime")} placeholder="11:00 AM" />
              </div>
              <div>
                <label className={LABEL}>Front desk note</label>
                <input className={INPUT} value={form.frontDeskHours} onChange={set("frontDeskHours")} placeholder="Front desk open 24 / 7" />
              </div>
            </div>
          </div>

          {/* Sidebar quick-contacts */}
          <div className={CARD}>
            <h3 className={SECT}>Sidebar (beside contact form)</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className={LABEL}>Reservations phone</label>
                <input className={INPUT} value={form.reservationPhone} onChange={set("reservationPhone")} placeholder="+880 1XXX-XXXXXX" />
              </div>
              <div>
                <label className={LABEL}>Events & Weddings phone</label>
                <input className={INPUT} value={form.eventsPhone} onChange={set("eventsPhone")} placeholder="+880 1XXX-XXXXXX" />
              </div>
              <div>
                <label className={LABEL}>Sidebar email</label>
                <input type="email" className={INPUT} value={form.sidebarEmail} onChange={set("sidebarEmail")} placeholder="hello@ambernivaas.com" />
              </div>
            </div>
          </div>

          {/* Contact form recipient */}
          <div className={CARD}>
            <h3 className={SECT}>Contact Form Settings</h3>
            <div>
              <label className={LABEL}>Send form submissions to (email)</label>
              <input type="email" className={INPUT} value={form.contactFormEmail} onChange={set("contactFormEmail")}
                placeholder="Leave blank to use default EMAIL_USER from env" />
              <p className="mt-1.5 text-[10px] text-white/25">All contact form messages will be forwarded to this address via SMTP.</p>
            </div>
          </div>

        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB: Map & Location                                                  */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {tab === "map" && (
        <div className="space-y-6">

          {/* Mode toggle */}
          <div className={CARD}>
            <h3 className={SECT}>Embed Mode</h3>
            <div className="grid sm:grid-cols-2 gap-3 mt-1">
              {[
                {
                  key: "unofficial",
                  label: "Unofficial Embed",
                  badge: "No API key needed",
                  badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                  desc: "Uses maps.google.com — works immediately, no quota or billing required.",
                },
                {
                  key: "official",
                  label: "Official Embed API",
                  badge: mapsApiKey ? "Key configured" : "Key required",
                  badgeColor: mapsApiKey
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    : "text-amber-400 bg-amber-500/10 border-amber-500/20",
                  desc: "Uses Google Maps Embed API v1 — requires GOOGLE_MAPS_EMBED_API_KEY in .env.",
                },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => { setSaved(false); setForm((f) => ({ ...f, mapEmbedMode: opt.key })); }}
                  className={`text-left p-4 rounded-xl border transition-all duration-200 space-y-2
                    ${form.mapEmbedMode === opt.key
                      ? "border-[#7A2267]/60 bg-[#7A2267]/08"
                      : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-semibold text-white/80">{opt.label}</span>
                    <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border font-semibold ${opt.badgeColor}`}>
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/30 leading-relaxed">{opt.desc}</p>
                  <div className={`w-3 h-3 rounded-full border-2 transition-all duration-200 ${
                    form.mapEmbedMode === opt.key ? "border-[#7A2267] bg-[#7A2267]" : "border-white/20"
                  }`} />
                </button>
              ))}
            </div>

            {form.mapEmbedMode === "official" && !mapsApiKey && (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-500/[0.05] border border-amber-500/20 text-[11px] text-amber-400/80 mt-2">
                <svg viewBox="0 0 14 14" width="14" height="14" fill="none" className="shrink-0 mt-0.5">
                  <path d="M7 1L13 12H1L7 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                  <path d="M7 5.5v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  <circle cx="7" cy="10" r="0.6" fill="currentColor"/>
                </svg>
                Add <code className="font-mono bg-white/10 px-1 py-0.5 rounded mx-1">GOOGLE_MAPS_EMBED_API_KEY=your_key</code> to <code className="font-mono bg-white/10 px-1 py-0.5 rounded">.env</code>.
                Get one at{" "}
                <a href="https://console.cloud.google.com/apis/library/maps-embed-backend.googleapis.com"
                  target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-300 ml-1">
                  Google Cloud Console → Maps Embed API
                </a>.
              </div>
            )}
          </div>

          {/* Coordinates */}
          <div className={CARD}>
            <h3 className={SECT}>Pin Location</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Latitude</label>
                <input type="number" step="any" className={INPUT} value={form.mapLat}
                  onChange={set("mapLat")} placeholder="23.9" />
              </div>
              <div>
                <label className={LABEL}>Longitude</label>
                <input type="number" step="any" className={INPUT} value={form.mapLng}
                  onChange={set("mapLng")} placeholder="90.2" />
              </div>
            </div>
            <p className="text-[10px] text-white/25 leading-relaxed">
              Right-click the exact location on Google Maps → copy coordinates.
              The "Open in Maps" button on the website will navigate to this pin.
            </p>
            {mapsOpenUrl && (
              <a href={mapsOpenUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] text-[#7A2267] hover:text-[#c05aae] transition-colors">
                Open this location in Google Maps →
              </a>
            )}
          </div>

          {/* Custom embed URL override */}
          <div className={CARD}>
            <h3 className={SECT}>Custom Embed URL <span className="normal-case text-white/20 tracking-normal font-normal ml-1">(optional override)</span></h3>
            <input className={INPUT} value={form.mapEmbedUrl} onChange={set("mapEmbedUrl")}
              placeholder="Paste any iframe src URL here to override the auto-generated embed" />
            <p className="text-[10px] text-white/25 leading-relaxed">
              Leave blank to auto-generate from coordinates + selected mode above.
            </p>
          </div>

          {/* Live preview */}
          {embedSrc ? (
            <div className={CARD}>
              <h3 className={SECT}>Live Preview</h3>
              <div className="rounded-xl overflow-hidden aspect-[16/7] border border-white/[0.08]">
                <iframe
                  src={embedSrc}
                  width="100%" height="100%"
                  style={{ border: 0 }}
                  allowFullScreen loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Map preview"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 rounded-xl border border-dashed border-white/[0.08] text-[12px] text-white/20">
              {form.mapEmbedMode === "official" && !mapsApiKey
                ? "Add API key to preview"
                : "Enter coordinates to preview"}
            </div>
          )}

        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB: Directions                                                       */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {tab === "directions" && (
        <div className={CARD}>
          <h3 className={SECT}>How to Find Us</h3>
          <div className="space-y-5">
            {form.directions.map((d, i) => (
              <div key={i} className="space-y-3 pb-5 border-b border-white/[0.06] last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-white/25 font-semibold">Direction {i + 1}</span>
                  {form.directions.length > 1 && (
                    <button type="button" onClick={() => removeDir(i)}
                      className="text-[11px] text-red-400/50 hover:text-red-400 transition-colors font-semibold">
                      Remove
                    </button>
                  )}
                </div>
                <div>
                  <label className={LABEL}>Heading</label>
                  <input className={INPUT} value={d.label} onChange={(e) => setDir(i, "label", e.target.value)} placeholder="From Dhaka City" />
                </div>
                <div>
                  <label className={LABEL}>Description</label>
                  <textarea className={`${INPUT} resize-none`} rows={3} value={d.desc}
                    onChange={(e) => setDir(i, "desc", e.target.value)}
                    placeholder="Approximately 1 hour via the Dhaka–Aricha Highway…" />
                </div>
              </div>
            ))}
            <button type="button" onClick={addDir}
              className="text-[11px] text-[#7A2267]/70 hover:text-[#7A2267] transition-colors font-semibold">
              + Add direction
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB: Messages                                                         */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {tab === "messages" && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex gap-2">
            {["all", "new", "read", "replied"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setMsgFilter(f)}
                className={`text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-full border transition-all duration-200
                  ${msgFilter === f
                    ? "bg-[#7A2267] text-white border-[#7A2267]"
                    : "border-white/[0.08] text-white/35 hover:text-white/60"}`}
              >
                {f}
                {f === "new" && newCount > 0 && (
                  <span className="ml-1 opacity-70">({newCount})</span>
                )}
              </button>
            ))}
          </div>

          {filteredMessages.length === 0 && (
            <div className="text-center py-16 text-white/20 text-[13px]">
              No messages{msgFilter !== "all" ? ` with status "${msgFilter}"` : ""}.
            </div>
          )}

          <div className="space-y-3">
            {filteredMessages.map((msg) => (
              <div key={msg._id}
                className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-3">
                {/* header */}
                <div className="flex items-start gap-3 justify-between flex-wrap">
                  <div className="space-y-0.5">
                    <p className="text-[13px] font-semibold text-white/80">{msg.name}</p>
                    <p className="text-[11px] text-white/35">{msg.email}{msg.phone ? ` · ${msg.phone}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full border font-semibold ${STATUS_COLOR[msg.status]}`}>
                      {msg.status}
                    </span>
                    <span className="text-[10px] text-white/20">
                      {new Date(msg.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>

                {msg.subject && (
                  <p className="text-[10px] uppercase tracking-wider text-white/30">Re: {msg.subject}</p>
                )}

                <p className="text-[12.5px] text-white/55 leading-relaxed whitespace-pre-line">{msg.message}</p>

                {/* sent reply preview */}
                {msg.reply && (
                  <div className="mt-1 border border-emerald-500/15 bg-emerald-500/[0.04] rounded-xl p-4 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <svg viewBox="0 0 14 14" width="11" height="11" fill="none" className="text-emerald-400 shrink-0">
                        <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-[9px] uppercase tracking-wider text-emerald-400/70 font-semibold">
                        Reply sent
                        {msg.repliedAt ? ` · ${new Date(msg.repliedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}` : ""}
                      </span>
                    </div>
                    <p className="text-[12px] text-white/40 leading-relaxed whitespace-pre-line pl-[19px]">{msg.reply}</p>
                  </div>
                )}

                {/* reply composer */}
                {replyState[msg._id]?.open && (
                  <div className="mt-2 space-y-2.5 border-t border-white/[0.06] pt-4">
                    <label className="block text-[9px] uppercase tracking-wider text-white/30 font-semibold">
                      Your reply to {msg.name}
                    </label>
                    <textarea
                      rows={5}
                      value={replyState[msg._id]?.text ?? ""}
                      onChange={(e) => setReply(msg._id, { text: e.target.value })}
                      placeholder={`Dear ${msg.name},\n\nThank you for reaching out…`}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-[13px] text-white
                        placeholder-white/15 focus:outline-none focus:border-[#7A2267]/60 transition-all duration-200 resize-none"
                    />
                    {replyState[msg._id]?.error && (
                      <p className="text-[11px] text-red-400/80">{replyState[msg._id].error}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={replyState[msg._id]?.sending}
                        onClick={() => handleSendReply(msg._id)}
                        className="text-[10px] font-semibold uppercase tracking-wider px-5 py-2 rounded-full
                          bg-[#7A2267] text-white hover:bg-[#8a256f] transition-all duration-200 disabled:opacity-50"
                      >
                        {replyState[msg._id]?.sending ? "Sending…" : "Send Reply"}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleReply(msg._id)}
                        className="text-[10px] text-white/25 hover:text-white/50 transition-colors px-3"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* actions */}
                <div className="flex items-center gap-3 pt-1 flex-wrap border-t border-white/[0.04] mt-1">
                  <button
                    type="button"
                    onClick={() => toggleReply(msg._id)}
                    className={`text-[10px] font-semibold transition-colors
                      ${replyState[msg._id]?.open
                        ? "text-white/30 hover:text-white/50"
                        : "text-[#7A2267] hover:text-[#c05aae]"}`}
                  >
                    {replyState[msg._id]?.open ? "Close reply" : msg.reply ? "Edit & resend reply" : "Reply →"}
                  </button>
                  <div className="ml-auto flex gap-3">
                    {msg.status !== "read" && (
                      <button type="button" onClick={() => handleStatusChange(msg._id, "read")}
                        className="text-[10px] text-white/30 hover:text-white/60 transition-colors">
                        Mark read
                      </button>
                    )}
                    <button type="button" onClick={() => handleDeleteMessage(msg._id)}
                      className="text-[10px] text-red-400/40 hover:text-red-400 transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </form>
  );
}
