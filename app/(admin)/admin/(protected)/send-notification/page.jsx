"use client";

import { useState, useEffect, useTransition } from "react";
import {
  sendNotification,
  getAdminNotifications,
  deleteNotification,
} from "@/actions/notifications/notificationActions";
import { getAdminDiscounts } from "@/actions/discount/discountActions";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const TYPE_COLORS = {
  message:        "bg-blue-500/10 text-blue-400 border-blue-500/20",
  alert:          "bg-red-500/10 text-red-400 border-red-500/20",
  coupon:         "bg-amber-500/10 text-amber-400 border-amber-500/20",
  booking_update: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  payment:        "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  system:         "bg-white/5 text-white/40 border-white/10",
};

const EMPTY_FORM = {
  type: "message",
  targetType: "all",
  targetUserId: "",
  header: "",
  body: "",
  image: "",
  linkedDiscountId: "",
};

// ─── Compose Form ─────────────────────────────────────────────────────────────
function ComposeForm({ discounts, onSent }) {
  const [form, setForm]   = useState(EMPTY_FORM);
  const [isPending, start] = useTransition();
  const [success, setSuccess] = useState(false);

  function set(k, v) { setForm((p) => ({ ...p, [k]: v })); }

  async function handleSend() {
    if (!form.header.trim()) { alert("Header is required."); return; }
    if (!form.body.trim())   { alert("Body is required."); return; }
    if (form.targetType === "user" && !form.targetUserId.trim()) {
      alert("Please enter a User ID for personal notifications."); return;
    }

    start(async () => {
      try {
        await sendNotification(form);
        setForm(EMPTY_FORM);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        onSent();
      } catch (err) {
        alert(err.message || "Failed to send notification.");
      }
    });
  }

  const inp = "w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-[12.5px] text-white/85 placeholder:text-white/20 outline-none focus:border-[#7A2267]/60 transition-all";
  const lbl = "block text-[9px] uppercase tracking-[0.18em] text-white/30 font-semibold mb-1.5";

  return (
    <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6 space-y-5">
      <h2 className="text-[15px] font-semibold text-white/85">Compose Notification</h2>

      {success && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-[12.5px] text-emerald-400">
          <svg viewBox="0 0 14 14" width="14" height="14" fill="none">
            <circle cx="7" cy="7" r="6" fill="#10b981"/>
            <path d="M4 7l2 2 4-4" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Notification sent successfully!
        </div>
      )}

      {/* Type */}
      <div>
        <label className={lbl}>Notification Type</label>
        <div className="flex flex-wrap gap-2">
          {[["message", "Message"], ["alert", "Alert"], ["coupon", "Coupon"], ["booking_update", "Booking Update"], ["payment", "Payment"], ["system", "System"]].map(([v, label]) => (
            <button key={v} type="button"
              onClick={() => set("type", v)}
              className={`px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all
                ${form.type === v ? "bg-[#7A2267] border-[#7A2267] text-white" : "bg-white/5 border-white/[0.08] text-white/35 hover:border-white/20"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Target */}
      <div>
        <label className={lbl}>Send To</label>
        <div className="flex gap-2 mb-3">
          {[["all", "All Users"], ["user", "Specific User"]].map(([v, label]) => (
            <button key={v} type="button"
              onClick={() => set("targetType", v)}
              className={`flex-1 py-2.5 rounded-xl border text-[12px] font-semibold transition-all
                ${form.targetType === v ? "bg-[#7A2267] border-[#7A2267] text-white" : "bg-white/5 border-white/10 text-white/35 hover:border-white/20"}`}>
              {label}
            </button>
          ))}
        </div>
        {form.targetType === "user" && (
          <input className={inp} placeholder="User ID (MongoDB ObjectId)"
            value={form.targetUserId}
            onChange={(e) => set("targetUserId", e.target.value)} />
        )}
      </div>

      {/* Header */}
      <div>
        <label className={lbl}>Header / Title *</label>
        <input className={inp} placeholder="Notification headline…"
          value={form.header} onChange={(e) => set("header", e.target.value)} />
      </div>

      {/* Body */}
      <div>
        <label className={lbl}>Body / Message *</label>
        <textarea rows={3} className={inp} placeholder="Full notification message…"
          value={form.body} onChange={(e) => set("body", e.target.value)} />
      </div>

      {/* Image */}
      <div>
        <label className={lbl}>Image URL <span className="normal-case text-white/20">(optional)</span></label>
        <input className={inp} placeholder="https://… (shown as banner in the notification)"
          value={form.image} onChange={(e) => set("image", e.target.value)} />
        {form.image && (
          <img src={form.image} alt="Preview" className="mt-2 h-20 rounded-xl object-cover border border-white/10" />
        )}
      </div>

      {/* Link to discount */}
      {(form.type === "coupon" || form.type === "message") && discounts.length > 0 && (
        <div>
          <label className={lbl}>Link Coupon / Offer <span className="normal-case text-white/20">(optional)</span></label>
          <select className={inp} value={form.linkedDiscountId} onChange={(e) => set("linkedDiscountId", e.target.value)}>
            <option value="">None</option>
            {discounts.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}{d.code ? ` — ${d.code}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <button onClick={handleSend} disabled={isPending}
        className="w-full py-3 rounded-xl bg-[#7A2267] hover:bg-[#8e2878] text-white font-semibold text-[13px] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
        {isPending ? (
          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</>
        ) : (
          <>
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
              <path d="M14 2L1 7l5 2 2 5 6-12z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Send Notification
          </>
        )}
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SendNotificationPage() {
  const [notifications, setNotifications] = useState([]);
  const [discounts, setDiscounts]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [deletingId, setDeletingId]       = useState(null);

  function reload() {
    getAdminNotifications({ limit: 30 }).then(({ notifications }) => {
      setNotifications(notifications);
      setLoading(false);
    }).catch(() => setLoading(false));
  }

  useEffect(() => {
    reload();
    getAdminDiscounts({ type: "coupon" }).then(setDiscounts).catch(() => {});
  }, []);

  async function handleDelete(id) {
    if (!confirm("Delete this notification?")) return;
    setDeletingId(id);
    await deleteNotification(id).catch(() => {});
    setDeletingId(null);
    reload();
  }

  const cell = "px-4 py-3 text-[12px] text-white/55";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold text-white/90">Notifications</h1>
        <p className="text-[11.5px] text-white/30 mt-0.5">Send messages, alerts, coupons, and updates to users</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">
        {/* Compose */}
        <div>
          <ComposeForm discounts={discounts} onSent={reload} />
        </div>

        {/* Log */}
        <div>
          <h2 className="text-[13px] font-semibold text-white/70 mb-3">Sent Notifications</h2>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {["Type", "Header", "Target", "Sent At", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[9px] uppercase tracking-[0.18em] text-white/20 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="text-center py-10 text-white/20 text-[12px]">Loading…</td></tr>
                  ) : notifications.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-10 text-white/20 text-[12px]">No notifications sent yet.</td></tr>
                  ) : (
                    notifications.map((n) => (
                      <tr key={n._id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                        <td className={cell}>
                          <span className={`text-[9.5px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${TYPE_COLORS[n.type] || TYPE_COLORS.system}`}>
                            {n.type?.replace("_", " ")}
                          </span>
                        </td>
                        <td className={`${cell} max-w-[220px]`}>
                          <p className="font-semibold text-white/75 truncate">{n.header}</p>
                          <p className="text-[10.5px] text-white/30 truncate mt-0.5">{n.body}</p>
                        </td>
                        <td className={cell}>
                          {n.targetType === "all"
                            ? <span className="text-[10px] text-emerald-400 font-semibold">All Users</span>
                            : <span className="text-[10px] text-violet-400 font-semibold">{n.targetUser?.name || n.targetUser?.email || "User"}</span>}
                        </td>
                        <td className={`${cell} text-white/30 whitespace-nowrap`}>{fmtDate(n.createdAt)}</td>
                        <td className={`${cell} text-right`}>
                          <button onClick={() => handleDelete(n._id)} disabled={deletingId === n._id}
                            className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all">
                            <svg viewBox="0 0 12 12" width="11" height="11" fill="none">
                              <path d="M1.5 3h9M4 3V2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M10 3l-.65 7a1 1 0 0 1-1 .87H3.65a1 1 0 0 1-1-.87L2 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
