import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import dbConnect from "@/lib/db";
import Media from "@/models/Media";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_SIZE_MB   = 10;

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
    if (!session?.user?.role || !hasPermission(session.user.role, "settings.write")) {
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
        { error: "Only image files are allowed (JPEG, PNG, WebP, GIF, AVIF)." },
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

    // ── Sanitize folder ───────────────────────────────────────────────────────
    const folder = safeFolder(formData.get("folder"));

    // ── Build filename & path ─────────────────────────────────────────────────
    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const ext      = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const safeName = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9_\-]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 40);
    const filename = `${Date.now()}-${safeName}.${ext}`;
    const filepath = path.join(uploadsDir, filename);

    // ── Write file ────────────────────────────────────────────────────────────
    await writeFile(filepath, buffer);

    const url = `/uploads/${filename}`;

    // ── Persist to DB (non-fatal) ─────────────────────────────────────────────
    try {
      await dbConnect();
      await Media.create({
        filename,
        url,
        originalName: file.name,
        size:         file.size,
        mimeType:     file.type,
        folder,
        uploadedBy:   session.user.id || session.user.email,
      });
    } catch (dbErr) {
      console.error("Media DB save failed (non-fatal):", dbErr);
    }

    return NextResponse.json({ url, filename, folder });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}

export const config = {
  api: { bodyParser: false },
};
