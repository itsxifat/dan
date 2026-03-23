"use server";

import dbConnect from "@/lib/db";
import Media from "@/models/Media";
import { unlink } from "fs/promises";
import path from "path";

export async function getMedia({ page = 1, limit = 48 } = {}) {
  await dbConnect();
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Media.find({}).sort({ uploadedAt: -1 }).skip(skip).limit(limit).lean(),
    Media.countDocuments(),
  ]);
  return {
    items: JSON.parse(JSON.stringify(items)),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

export async function updateMediaAlt(id, alt) {
  await dbConnect();
  await Media.findByIdAndUpdate(id, { alt: String(alt).trim() });
}

export async function deleteMedia(id) {
  await dbConnect();
  const media = await Media.findById(id);
  if (!media) throw new Error("Media not found.");

  // Remove file from disk
  const filepath = path.join(process.cwd(), "public", media.url);
  try {
    await unlink(filepath);
  } catch {
    // File may already be missing — continue with DB removal
  }

  await Media.findByIdAndDelete(id);
}

export async function deleteMediaBulk(ids) {
  await dbConnect();
  const items = await Media.find({ _id: { $in: ids } }).lean();
  await Promise.all(
    items.map(async (media) => {
      const filepath = path.join(process.cwd(), "public", media.url);
      try { await unlink(filepath); } catch { /* ignore */ }
    })
  );
  await Media.deleteMany({ _id: { $in: ids } });
}
