import { NextResponse } from "next/server";
import { uploadToCdn, cdnSignedUrl } from "@/lib/cdn";
import { optimizeFile } from "@/lib/imageOptimize";

const ALLOWED_TYPES = [
  "image/jpeg", "image/jpg", "image/png", "image/webp",
];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB — ID documents / photos

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string")
      return NextResponse.json({ error: "No file provided." }, { status: 400 });

    if (!ALLOWED_TYPES.includes(file.type))
      return NextResponse.json(
        { error: "Only JPG, PNG, or WebP images are allowed." },
        { status: 400 }
      );

    if (file.size > MAX_SIZE)
      return NextResponse.json(
        { error: "File must be under 5 MB." },
        { status: 400 }
      );

    if (file.size === 0)
      return NextResponse.json({ error: "File is empty." }, { status: 400 });

    // Optimise (resize + WebP) then upload to EnCDN, and hand back a lifetime
    // signed URL: these docs are viewed from admin/emails without a guaranteed
    // whitelisted Referer, so the link must bypass domain-locking.
    const optimised = await optimizeFile(file);
    const cdn = await uploadToCdn(optimised);
    const url = cdnSignedUrl(cdn.publicUrl, { lifetime: true });

    return NextResponse.json({ url });
  } catch (err) {
    console.error("Doc upload error:", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
