import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import dbConnect from "@/lib/db";
import Media from "@/models/Media";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_SIZE_MB = 10;

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ error: `File too large. Max ${MAX_SIZE_MB}MB.` }, { status: 400 });
    }

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const ext      = file.name.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const safeName = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 40);
    const filename = `${Date.now()}-${safeName}.${ext}`;
    const filepath = path.join(uploadsDir, filename);

    await writeFile(filepath, buffer);

    const url = `/uploads/${filename}`;

    // Persist to media library (non-fatal — file is saved regardless)
    try {
      await dbConnect();
      await Media.create({
        filename,
        url,
        originalName: file.name,
        size:         file.size,
        mimeType:     file.type,
      });
    } catch (dbErr) {
      console.error("Media DB save failed (non-fatal):", dbErr);
    }

    return NextResponse.json({ url, filename });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}

export const config = {
  api: { bodyParser: false },
};
