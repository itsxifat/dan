/**
 * NoSQL injection guard + input sanitizer
 *
 * MongoDB operators ($where, $gt, $regex, …) embedded in user-controlled
 * values are the primary NoSQL injection vector. This module strips them
 * before any value reaches a query.
 *
 * Usage — wrap any user-supplied object before using it in a query:
 *
 *   import { sanitize, sanitizeString } from "@/lib/sanitize";
 *
 *   const safeBody = sanitize(await req.json());
 *   const safeName = sanitizeString(body.name, 120);
 */

// Characters/patterns that have special meaning in MongoDB queries
const OPERATOR_RE = /^\$/;          // keys starting with "$"
const DOT_IN_KEY  = /\./;           // dotted paths used for nested-key injection

/**
 * Recursively strip MongoDB operator keys from an object and sanitize string
 * values. Safe to call on any value — primitives are returned unchanged.
 *
 * @param {unknown} value
 * @param {number}  [maxDepth=10]  - max recursion depth (prevents stack bombs)
 * @returns {unknown}
 */
export function sanitize(value, maxDepth = 10) {
  if (maxDepth <= 0) return null;

  if (value === null || value === undefined) return value;

  if (typeof value === "string") {
    // Trim + hard-cap length to prevent oversized payload attacks
    return value.trim().slice(0, 10_000);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (value instanceof Date) return value;

  if (Array.isArray(value)) {
    return value
      .slice(0, 1_000) // cap array length
      .map((item) => sanitize(item, maxDepth - 1));
  }

  if (typeof value === "object") {
    const clean = {};
    for (const [k, v] of Object.entries(value)) {
      // Drop any key that starts with $ or contains a dot
      if (OPERATOR_RE.test(k) || DOT_IN_KEY.test(k)) continue;
      clean[k] = sanitize(v, maxDepth - 1);
    }
    return clean;
  }

  // Reject anything else (functions, symbols, etc.)
  return null;
}

/**
 * Sanitize and clamp a single string value.
 *
 * @param {unknown} value
 * @param {number}  [maxLen=500]
 * @returns {string}
 */
export function sanitizeString(value, maxLen = 500) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen);
}

/**
 * Sanitize a numeric value, returning `fallback` if the result is not finite.
 *
 * @param {unknown} value
 * @param {number}  fallback
 * @param {number}  [min]
 * @param {number}  [max]
 * @returns {number}
 */
export function sanitizeNumber(value, fallback = 0, min, max) {
  const n = Number(value);
  if (!isFinite(n)) return fallback;
  if (min !== undefined && n < min) return min;
  if (max !== undefined && n > max) return max;
  return n;
}

/**
 * Assert that a string is a valid 24-character MongoDB ObjectId hex string.
 * Returns null for anything else — use before passing IDs to queries.
 *
 * @param {unknown} value
 * @returns {string|null}
 */
export function sanitizeObjectId(value) {
  if (typeof value !== "string") return null;
  return /^[a-f\d]{24}$/i.test(value) ? value : null;
}

/**
 * Sanitize an email address: lowercase, trimmed, basic format check.
 *
 * @param {unknown} value
 * @returns {string|null}  null when format is invalid
 */
export function sanitizeEmail(value) {
  if (typeof value !== "string") return null;
  const clean = value.trim().toLowerCase().slice(0, 254);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean) ? clean : null;
}
