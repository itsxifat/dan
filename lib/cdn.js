import crypto from "crypto";

/**
 * EnCDN client — the single place the app talks to the media CDN
 * (https://cdn.enfinito.cloud).
 *
 * SECURITY: CDN_API_SECRET authorises deletes and signs delivery URLs. Keep
 * this module server-side only (route handlers, server actions, email) — it
 * must never be imported into a "use client" component or exposed through a
 * NEXT_PUBLIC_* variable.
 *
 * URL strategy (see plan):
 *   • Site-embedded images  → plain publicUrl, served in whitelist mode.
 *   • OG images / emails / sent files → lifetime signed URL (bypasses the
 *     Referer-based domain lock those contexts can't satisfy).
 */

const BASE_URL = (process.env.CDN_BASE_URL || "https://cdn.enfinito.cloud").replace(/\/$/, "");
const API_KEY  = process.env.CDN_API_KEY;
const SECRET   = process.env.CDN_API_SECRET;

// `expires` value used for never-expiring signed links (per EnCDN docs).
const LIFETIME_EXPIRES = 253402300799;

function requireConfig() {
  if (!API_KEY || !SECRET) {
    throw new Error(
      "EnCDN is not configured. Set CDN_API_KEY and CDN_API_SECRET in the environment."
    );
  }
}

function authHeaders() {
  return {
    "X-CDN-API-Key":    API_KEY,
    "X-CDN-API-Secret": SECRET,
  };
}

/** True for any URL that points at the configured CDN host. */
export function isCdnUrl(url) {
  return typeof url === "string" && url.startsWith(`${BASE_URL}/d/`);
}

/**
 * Pull `{ clientId, filename }` out of a delivery URL of the shape
 * `https://cdn.enfinito.cloud/d/CLIENT_ID/FILENAME?…`. Returns null if the
 * string isn't a CDN delivery URL.
 */
export function parseCdnUrl(url) {
  if (typeof url !== "string") return null;
  const m = url.match(/\/d\/([^/]+)\/([^/?#]+)/);
  if (!m) return null;
  return { clientId: m[1], filename: m[2] };
}

/**
 * Upload to EnCDN. Accepts either:
 *   • a web `File`/`Blob` (from `formData.get("file")`), or
 *   • a processed descriptor `{ buffer, filename, contentType }` (e.g. the
 *     WebP output of lib/imageOptimize).
 *
 * @returns {Promise<{id,filename,publicUrl,mimeType,size,originalName}>}
 */
export async function uploadToCdn(file) {
  requireConfig();

  let blob, name;
  if (file && file.buffer) {
    blob = new Blob([file.buffer], { type: file.contentType });
    name = file.filename;
  } else {
    blob = file;            // a web File is already Blob-like
    name = file.name;
  }

  const form = new FormData();
  form.append("file", blob, name);

  const res = await fetch(`${BASE_URL}/api/media/upload`, {
    method:  "POST",
    headers: authHeaders(), // do NOT set Content-Type — fetch sets the multipart boundary
    body:    form,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.media) {
    throw new Error(data?.error || `CDN upload failed (${res.status}).`);
  }

  const m = data.media;
  return {
    id:           m.id,
    filename:     m.filename,
    publicUrl:    m.publicUrl,
    mimeType:     m.mimeType,
    size:         m.size,
    originalName: m.originalName,
  };
}

/**
 * Delete a file from EnCDN by its filename (the last path segment of a
 * delivery URL). Idempotent: a 404 means the file is already gone and is
 * treated as success, as the EnCDN docs recommend.
 */
export async function deleteFromCdn(filename) {
  requireConfig();
  if (!filename) return;

  const res = await fetch(
    `${BASE_URL}/api/media/file/${encodeURIComponent(filename)}`,
    { method: "DELETE", headers: authHeaders() }
  );

  if (!res.ok && res.status !== 404) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || `CDN delete failed (${res.status}).`);
  }
}

/**
 * Build a signed delivery URL that bypasses domain-locking — for OG images,
 * email bodies and other contexts that can't send a whitelisted Referer.
 *
 * Computed offline (no API round-trip) per the documented algorithm:
 *   stringToSign = `${clientId}/${filename}|${expires}`
 *   token        = HMAC-SHA256(stringToSign, apiSecret).hex()
 *
 * @param {string} source  A CDN public/delivery URL, OR a bare filename.
 * @param {object} [opts]
 * @param {boolean} [opts.lifetime=true]  Never-expiring link.
 * @param {number}  [opts.expiresMinutes] Temporary link length (when lifetime=false).
 * @param {string}  [opts.clientId]       Required only when `source` is a bare filename.
 */
export function cdnSignedUrl(source, { lifetime = true, expiresMinutes = 60, clientId } = {}) {
  requireConfig();
  if (!source) return source;

  let filename = source;
  let cid = clientId;

  const parsed = parseCdnUrl(source);
  if (parsed) {
    filename = parsed.filename;
    cid = cid || parsed.clientId;
  }
  if (!cid) {
    throw new Error("cdnSignedUrl: clientId is required when signing a bare filename.");
  }

  const expires = lifetime
    ? LIFETIME_EXPIRES
    : Math.floor(Date.now() / 1000) + expiresMinutes * 60;

  const token = crypto
    .createHmac("sha256", SECRET)
    .update(`${cid}/${filename}|${expires}`)
    .digest("hex");

  return `${BASE_URL}/d/${cid}/${filename}?expires=${expires}&token=${token}`;
}
