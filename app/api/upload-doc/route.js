import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = [
  "image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf",
];
const MAX_SIZE = 1 * 1024 * 1024; // 1 MB

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string")
      return NextResponse.json({ error: "No file provided." }, { status: 400 });

    if (!ALLOWED_TYPES.includes(file.type))
      return NextResponse.json(
        { error: "Only JPG, PNG, WebP, or PDF files are allowed." },
        { status: 400 }
      );

    if (file.size > MAX_SIZE)
      return NextResponse.json(
        { error: "File must be under 1 MB." },
        { status: 400 }
      );

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const dir = path.join(process.cwd(), "public", "uploads", "docs");
    await mkdir(dir, { recursive: true });

    const ext      = file.name.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const filename = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    await writeFile(path.join(dir, filename), buffer);

    return NextResponse.json({ url: `/uploads/docs/${filename}` });
  } catch (err) {
    console.error("Doc upload error:", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
