/* eslint-disable no-console */
/**
 * One-time migration: move locally-stored media to EnCDN and rewrite every
 * stored reference to the new CDN URL.
 *
 * Run (Node 20.6+, for --env-file):
 *   node --env-file=.env.local scripts/migrate-to-cdn.js
 *
 * Requires in the environment: CDN_API_KEY, CDN_API_SECRET, MONGODB_URI
 * (CDN_BASE_URL optional, defaults to https://cdn.enfinito.cloud). Add
 * MONGODB_URI to .env.local or export it before running.
 *
 * What it does:
 *   1. Uploads each local file once (static chrome assets + everything under
 *      public/uploads), building an  oldUrl -> newCdnUrl  map.
 *   2. Updates Media rows (url, filename, cdnId).
 *   3. Deep string-replaces oldUrl -> newUrl across every other collection.
 *   4. Prints the NEXT_PUBLIC_* values for the static assets to paste into env.
 *
 * Idempotent & resumable: the map is cached in scripts/cdn-migration-map.json,
 * already-CDN values never re-match, and re-runs skip uploaded files. Run it
 * against a DATABASE BACKUP first.
 */

const fs       = require("fs");
const path     = require("path");
const mongoose = require("mongoose");
const sharp    = require("sharp");

// Keep in sync with lib/imageOptimize.js
const MAX_EDGE = 2560;
const QUALITY  = 80;
const OPTIMIZABLE = new Set(["jpg", "jpeg", "png", "webp"]);

const BASE_URL = (process.env.CDN_BASE_URL || "https://cdn.enfinito.cloud").replace(/\/$/, "");
const API_KEY  = process.env.CDN_API_KEY;
const SECRET   = process.env.CDN_API_SECRET;
const MONGO    = process.env.MONGODB_URI;

const PUBLIC_DIR = path.join(process.cwd(), "public");
const MAP_FILE   = path.join(__dirname, "cdn-migration-map.json");

// Static chrome assets: oldUrl (as referenced) -> the NEXT_PUBLIC_* env var to set.
const STATIC_ASSETS = {
  "/logo.png":                  "NEXT_PUBLIC_LOGO_URL",
  "/hero.png":                  "NEXT_PUBLIC_HERO_URL",
  "/hero.jpeg":                 "NEXT_PUBLIC_HERO_FALLBACK_URL",
  "/section/about/left.png":    "NEXT_PUBLIC_ABOUT_LEFT_URL",
  "/section/about/middle.png":  "NEXT_PUBLIC_ABOUT_MIDDLE_URL",
  "/section/about/right.png":   "NEXT_PUBLIC_ABOUT_RIGHT_URL",
};

const MIME = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
  gif: "image/gif", avif: "image/avif", mp4: "video/mp4", webm: "video/webm",
  ogg: "video/ogg", mp3: "audio/mpeg", wav: "audio/wav", aac: "audio/aac",
  flac: "audio/flac",
};

function mimeFor(file) {
  const ext = file.split(".").pop().toLowerCase();
  return MIME[ext] || "application/octet-stream";
}

// ── CDN upload (optimise raster images to WebP first) ───────────────────────
async function uploadToCdn(absPath) {
  let buf  = await fs.promises.readFile(absPath);
  let name = path.basename(absPath);
  let type = mimeFor(name);

  const ext = name.split(".").pop().toLowerCase();
  if (OPTIMIZABLE.has(ext)) {
    buf  = await sharp(buf, { failOn: "none" })
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toBuffer();
    name = name.replace(/\.[^.]+$/, "") + ".webp";
    type = "image/webp";
  }

  const form = new FormData();
  form.append("file", new Blob([buf], { type }), name);

  const res = await fetch(`${BASE_URL}/api/media/upload`, {
    method:  "POST",
    headers: { "X-CDN-API-Key": API_KEY, "X-CDN-API-Secret": SECRET },
    body:    form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.media) {
    throw new Error(data.error || `upload failed (${res.status})`);
  }
  return { url: data.media.publicUrl, filename: data.media.filename, id: data.media.id };
}

// ── Local source discovery ──────────────────────────────────────────────────
function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(abs));
    else out.push(abs);
  }
  return out;
}

/** All local files to migrate, as  oldUrl -> absolute path. */
function collectSources() {
  const sources = {};

  for (const oldUrl of Object.keys(STATIC_ASSETS)) {
    const abs = path.join(PUBLIC_DIR, oldUrl);
    if (fs.existsSync(abs)) sources[oldUrl] = abs;
    else console.warn(`! static asset missing on disk, skipping: ${oldUrl}`);
  }

  const uploadsDir = path.join(PUBLIC_DIR, "uploads");
  for (const abs of walk(uploadsDir)) {
    const rel = "/" + path.relative(PUBLIC_DIR, abs).split(path.sep).join("/");
    sources[rel] = abs;
  }

  return sources;
}

// ── Deep replace ────────────────────────────────────────────────────────────
function makeReplacer(map) {
  // Longest oldUrls first so a longer path isn't shadowed by a shorter prefix.
  const entries = Object.entries(map).sort((a, b) => b[0].length - a[0].length);

  function remap(value, flag) {
    if (typeof value === "string") {
      let s = value;
      for (const [oldUrl, info] of entries) {
        if (s.includes(oldUrl)) { s = s.split(oldUrl).join(info.url); flag.changed = true; }
      }
      return s;
    }
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) value[i] = remap(value[i], flag);
      return value;
    }
    if (value && typeof value === "object") {
      // Leave BSON types (ObjectId, Decimal128…), Dates and Buffers untouched.
      if (value._bsontype || value instanceof Date || Buffer.isBuffer(value)) return value;
      for (const k of Object.keys(value)) value[k] = remap(value[k], flag);
      return value;
    }
    return value;
  }

  return remap;
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  if (!API_KEY || !SECRET) throw new Error("CDN_API_KEY / CDN_API_SECRET not set.");
  if (!MONGO) throw new Error("MONGODB_URI not set (add it to .env.local or export it).");

  // Resume from a previous run if present.
  const map = fs.existsSync(MAP_FILE) ? JSON.parse(fs.readFileSync(MAP_FILE, "utf8")) : {};

  // 1. Upload local files → build the map.
  const sources = collectSources();
  console.log(`Found ${Object.keys(sources).length} local file(s) to consider.`);
  for (const [oldUrl, abs] of Object.entries(sources)) {
    if (map[oldUrl]) { console.log(`= cached  ${oldUrl}`); continue; }
    try {
      map[oldUrl] = await uploadToCdn(abs);
      fs.writeFileSync(MAP_FILE, JSON.stringify(map, null, 2)); // persist after each upload
      console.log(`↑ uploaded ${oldUrl} -> ${map[oldUrl].url}`);
    } catch (err) {
      console.error(`✗ failed   ${oldUrl}: ${err.message}`);
    }
  }

  if (!Object.keys(map).length) {
    console.log("Nothing uploaded — no DB changes to make.");
    return;
  }

  // 2 + 3. Rewrite the database.
  await mongoose.connect(MONGO);
  const db = mongoose.connection.db;
  const remap = makeReplacer(map);

  // 2. Media rows: set url + filename + cdnId from the map.
  const media = db.collection("media");
  let mediaUpdated = 0;
  for (const doc of await media.find({}).toArray()) {
    const hit = map[doc.url];
    if (!hit) continue;
    await media.updateOne(
      { _id: doc._id },
      { $set: { url: hit.url, filename: hit.filename, cdnId: hit.id } }
    );
    mediaUpdated++;
  }
  console.log(`Media rows updated: ${mediaUpdated}`);

  // 3. Deep-replace every other collection.
  const collections = await db.listCollections().toArray();
  for (const { name } of collections) {
    if (name === "media") continue;
    const coll = db.collection(name);
    let changed = 0;
    for (const doc of await coll.find({}).toArray()) {
      const flag = { changed: false };
      remap(doc, flag);
      if (flag.changed) { await coll.replaceOne({ _id: doc._id }, doc); changed++; }
    }
    if (changed) console.log(`  ${name}: ${changed} doc(s) rewritten`);
  }

  await mongoose.disconnect();

  // 4. Print env values for the static assets.
  console.log("\n── Paste these into .env.local (static asset URLs) ──");
  for (const [oldUrl, envVar] of Object.entries(STATIC_ASSETS)) {
    if (map[oldUrl]) console.log(`${envVar}=${map[oldUrl].url}`);
  }
  console.log("\nDone. Re-running is safe (idempotent).");
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
