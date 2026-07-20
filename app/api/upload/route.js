import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Media from "@/models/Media";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadToCdn } from "@/lib/cdn";
import { optimizeFile } from "@/lib/imageOptimize";

// EnCDN-supported types (images + video/audio). The Media Library UI is still
// image-only; video/audio is accepted here so the API can grow into it.
const ALLOWED_TYPES = [
  "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/avif",
  "video/mp4", "video/webm", "video/ogg",
  "audio/mpeg", "audio/mp3", "audio/wav", "audio/aac", "audio/flac",
];
const MAX_SIZE_MB = 100; // EnCDN default ceiling

function safeFolder(raw) {
  return String(raw || "general")
    .trim()
    .replace(/[^a-zA-Z0-9_\-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40) || "general";
}

export async function POST(req) {
  try {
    // ── Authentication ────────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Parse form data ───────────────────────────────────────────────────────
    const formData = await req.formData();
    const file     = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // ── File type validation ──────────────────────────────────────────────────
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type." },
        { status: 415 }
      );
    }

    // ── File size validation ──────────────────────────────────────────────────
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_SIZE_MB} MB.` },
        { status: 413 }
      );
    }

    // ── Zero-byte check ───────────────────────────────────────────────────────
    if (file.size === 0) {
      return NextResponse.json({ error: "File is empty." }, { status: 400 });
    }

    // ── Sanitize folder (app-side organisation only — EnCDN is flat) ──────────
    const folder = safeFolder(formData.get("folder"));

    // ── Optimise (resize + WebP) then upload to EnCDN ─────────────────────────
    // EnCDN serves files as-is, so we right-size here. Non-image types pass
    // through untouched.
    const optimised = await optimizeFile(file);
    const cdn = await uploadToCdn(optimised);
    const url = cdn.publicUrl;

    // ── Persist to DB (non-fatal) ─────────────────────────────────────────────
    try {
      await dbConnect();
      await Media.create({
        filename:     cdn.filename,
        cdnId:        cdn.id,
        url,
        originalName: cdn.originalName || file.name,
        size:         cdn.size || file.size,
        mimeType:     cdn.mimeType || file.type,
        folder,
        uploadedBy:   session.user.id || session.user.email,
      });
    } catch (dbErr) {
      console.error("Media DB save failed (non-fatal):", dbErr);
    }

    return NextResponse.json({ url, filename: cdn.filename, folder });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
