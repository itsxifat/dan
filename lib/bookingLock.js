// Shared room-hold constants and helpers.
//
// A hold is the short window in which a guest's chosen rooms are reserved for
// them so nobody else can check out with the same room. It is deliberately the
// MAXIMUM time we allow — the hold is released the moment the guest leaves
// checkout, and only ever runs to full length while they are actually paying.
//
// Pure utility — safe to import in both client and server components.

/** Maximum hold, sized to cover a full SSLCommerz payment round-trip. */
export const LOCK_DURATION_MS = 30 * 60 * 1000;

/** Warn the guest once the hold drops below this. */
export const LOCK_WARNING_MS = 5 * 60 * 1000;

/** sessionStorage key for the browser's hold identity. */
export const LOCK_SESSION_KEY = "dan_lock_session";

/** "12:05" / "0:47" — the countdown label shown during checkout. */
export function formatCountdown(ms) {
  const total   = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * A hold identity that survives reloads within the same tab, so a guest who
 * refreshes mid-checkout reclaims their own hold instead of colliding with it.
 * Returns "" during SSR.
 */
export function getLockSessionId() {
  if (typeof window === "undefined") return "";
  try {
    let id = window.sessionStorage.getItem(LOCK_SESSION_KEY);
    if (!id) {
      id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      window.sessionStorage.setItem(LOCK_SESSION_KEY, id);
    }
    return id;
  } catch {
    // Private mode / storage disabled — fall back to a per-page-load id.
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

/**
 * Release a hold. Uses sendBeacon when the page is going away (the only
 * transport the browser guarantees during unload), otherwise a keepalive fetch.
 */
export function releaseLock({ sessionId, rooms = [], beacon = false } = {}) {
  if (typeof window === "undefined" || !sessionId) return;
  const payload = JSON.stringify({ sessionId, rooms });

  if (beacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
    try {
      navigator.sendBeacon("/api/booking/unlock", new Blob([payload], { type: "application/json" }));
      return;
    } catch {
      // fall through to fetch
    }
  }

  fetch("/api/booking/unlock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}
