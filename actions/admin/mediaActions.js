"use server";

import dbConnect from "@/lib/db";
import Media from "@/models/Media";
import Folder from "@/models/Folder";
import { unlink } from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

// ─── Auth guards ──────────────────────────────────────────────────────────────

/** Read access: owner, admin, moderator, viewer */
async function requireRead() {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "dashboard.read")) {
    throw new Error("Unauthorized");
  }
  return session;
}

/** Write access: owner, admin only (settings.write) */
async function requireWrite() {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "settings.write")) {
    throw new Error("Insufficient permissions");
  }
  return session;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeFolder(name) {
  return String(name || "general")
    .trim()
    .replace(/[^a-zA-Z0-9_\- ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40) || "general";
}

// ─── Folders ──────────────────────────────────────────────────────────────────

export async function getFolders() {
  await requireRead();
  await dbConnect();

  await Folder.findOneAndUpdate(
    { name: "general" },
    { name: "general" },
    { upsert: true, new: true }
  );

  const [folderDocs, counts] = await Promise.all([
    Folder.find({}).sort({ name: 1 }).lean(),
    Media.aggregate([
      { $group: { _id: { $ifNull: ["$folder", "general"] }, count: { $sum: 1 } } },
    ]),
  ]);

  const countMap = {};
  for (const c of counts) countMap[c._id] = c.count;

  return folderDocs.map((f) => ({ name: f.name, count: countMap[f.name] || 0 }));
}

export async function createFolder(name) {
  await requireWrite();
  await dbConnect();
  const safe = safeFolder(name);
  if (!safe || safe === "general") throw new Error("Invalid folder name");
  await Folder.findOneAndUpdate({ name: safe }, { name: safe }, { upsert: true, new: true });
  return safe;
}

export async function renameFolder(oldName, newName) {
  await requireWrite();
  await dbConnect();
  const safe = safeFolder(newName);
  if (!safe) throw new Error("Invalid folder name");
  if (oldName === "general") throw new Error("Cannot rename the General folder");
  if (safe === "general") throw new Error("Cannot rename to 'general'");
  // Check target name not already taken
  const existing = await Folder.findOne({ name: safe });
  if (existing) throw new Error(`Folder "${safe}" already exists`);
  await Promise.all([
    Folder.findOneAndUpdate({ name: oldName }, { name: safe }),
    Media.updateMany({ folder: oldName }, { folder: safe }),
  ]);
  return safe;
}

export async function deleteFolder(name) {
  await requireWrite();
  await dbConnect();
  if (name === "general") throw new Error("Cannot delete the General folder");
  await Promise.all([
    Folder.findOneAndDelete({ name }),
    Media.updateMany({ folder: name }, { folder: "general" }),
  ]);
}

// ─── Media ────────────────────────────────────────────────────────────────────

export async function getMedia({ page = 1, limit = 48, folder = null, search = "" } = {}) {
  await requireRead();
  await dbConnect();

  let filter = {};
  if (search?.trim()) {
    const re = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.originalName = re;
  }
  if (folder) {
    const folderFilter =
      folder === "general"
        ? { $or: [{ folder: "general" }, { folder: { $exists: false } }, { folder: null }, { folder: "" }] }
        : { folder };
    filter = search?.trim() ? { $and: [{ originalName: filter.originalName }, folderFilter] } : folderFilter;
  }

  const skip = (Math.max(1, page) - 1) * limit;
  const [items, total] = await Promise.all([
    Media.find(filter).sort({ uploadedAt: -1 }).skip(skip).limit(limit).lean(),
    Media.countDocuments(filter),
  ]);

  return {
    items: JSON.parse(JSON.stringify(items)),
    total,
    page: Math.max(1, page),
    limit,
    pages: Math.ceil(total / limit),
  };
}

export async function updateMediaAlt(id, alt) {
  await requireWrite();
  await dbConnect();
  if (!id || typeof alt !== "string") throw new Error("Invalid input");
  await Media.findByIdAndUpdate(id, { alt: alt.trim().slice(0, 500) });
}

export async function moveMediaToFolder(ids, folder) {
  await requireWrite();
  await dbConnect();
  if (!Array.isArray(ids) || !ids.length) throw new Error("No items selected");
  const safe = safeFolder(folder);
  await Media.updateMany({ _id: { $in: ids } }, { folder: safe });
}

export async function copyMediaToFolder(ids, folder) {
  await requireWrite();
  await dbConnect();
  if (!Array.isArray(ids) || !ids.length) throw new Error("No items selected");
  const safe = safeFolder(folder);

  const sources = await Media.find({ _id: { $in: ids } }).lean();
  const toCopy  = sources.filter((item) => (item.folder || "general") !== safe);
  if (!toCopy.length) return 0;

  await Media.insertMany(
    toCopy.map(({ filename, url, originalName, size, mimeType, alt }) => ({
      filename,
      url,
      originalName,
      size,
      mimeType,
      alt:    alt || "",
      folder: safe,
    }))
  );

  return toCopy.length;
}

export async function deleteMedia(id) {
  await requireWrite();
  await dbConnect();
  const media = await Media.findById(id);
  if (!media) throw new Error("Media not found.");

  await Media.findByIdAndDelete(id);

  const remaining = await Media.countDocuments({ url: media.url });
  if (remaining === 0) {
    const filepath = path.join(process.cwd(), "public", media.url);
    try { await unlink(filepath); } catch { /* already gone */ }
  }
}

export async function deleteMediaBulk(ids) {
  await requireWrite();
  await dbConnect();
  if (!Array.isArray(ids) || !ids.length) throw new Error("No items selected");

  const items = await Media.find({ _id: { $in: ids } }).lean();
  await Media.deleteMany({ _id: { $in: ids } });

  await Promise.all(
    items.map(async (media) => {
      const remaining = await Media.countDocuments({ url: media.url });
      if (remaining === 0) {
        const filepath = path.join(process.cwd(), "public", media.url);
        try { await unlink(filepath); } catch { /* ignore */ }
      }
    })
  );
}
