"use client";

import { useState, useRef, useTransition, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getMedia, deleteMedia, deleteMediaBulk, updateMediaAlt } from "@/actions/admin/mediaActions";

const EASE = [0.16, 1, 0.3, 1];

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UploadZone({ onUploaded }) {
  const [dragging, setDragging]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState([]);
  const inputRef = useRef(null);

  const uploadFile = useCallback(async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    const res  = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data;
  }, []);

  async function handleFiles(files) {
    if (!files.length) return;
    setUploading(true);
    setProgress(files.map((f) => ({ name: f.name, status: "uploading" })));

    const results = await Promise.allSettled(
      files.map((file, i) =>
        uploadFile(file).then((data) => {
          setProgress((prev) => {
            const next = [...prev];
            next[i] = { name: file.name, status: "done" };
            return next;
          });
          return data;
        }).catch((err) => {
          setProgress((prev) => {
            const next = [...prev];
            next[i] = { name: file.name, status: "error", msg: err.message };
            return next;
          });
        })
      )
    );

    const uploaded = results.filter((r) => r.status === "fulfilled" && r.value).map((r) => r.value);
    if (uploaded.length) onUploaded();
    setUploading(false);
    setTimeout(() => setProgress([]), 2200);
  }

  return (
    <div className="space-y-3">
      <motion.div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const files = Array.from(e.dataTransfer.files || []).filter((f) =>
            f.type.startsWith("image/")
          );
          handleFiles(files);
        }}
        animate={{ scale: dragging ? 1.012 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed px-6 py-10 text-center
          transition-colors duration-200 select-none
          ${dragging
            ? "border-[#7A2267]/60 bg-[#7A2267]/5"
            : "border-white/10 hover:border-[#7A2267]/40 bg-white/[0.02]"
          }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-7 h-7 rounded-full border-2 border-[#7A2267]/25 border-t-[#7A2267]"
            />
            <p className="text-[12.5px] text-white/40">Uploading {progress.length} file{progress.length !== 1 ? "s" : ""}…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center">
              <svg viewBox="0 0 20 20" width="20" height="20" fill="none" className="text-white/30">
                <path d="M10 3v10M7 6l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 15v1a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-medium text-white/50">
                {dragging ? "Drop images here" : "Click or drag images here"}
              </p>
              <p className="text-[11px] text-white/25 mt-0.5">PNG, JPG, WebP, GIF — max 10 MB each</p>
            </div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            e.target.value = "";
            handleFiles(files);
          }}
        />
      </motion.div>

      {/* Upload progress row */}
      <AnimatePresence>
        {progress.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2">
              {progress.map((p, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border
                    ${p.status === "done"    ? "border-emerald-500/30 text-emerald-400 bg-emerald-400/8"   :
                      p.status === "error"   ? "border-red-500/30 text-red-400 bg-red-400/8"               :
                      "border-white/10 text-white/40 bg-white/4"}`}
                >
                  {p.status === "uploading" && (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      className="inline-block w-2.5 h-2.5 rounded-full border border-current border-t-transparent"
                    />
                  )}
                  {p.status === "done"  && <span>✓</span>}
                  {p.status === "error" && <span>✕</span>}
                  <span className="max-w-[120px] truncate">{p.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MediaCard({ item, selected, onSelect, onDelete, onAltSave }) {
  const [editing, setEditing]   = useState(false);
  const [alt, setAlt]           = useState(item.alt || "");
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving]     = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try { await onDelete(item._id); } catch { setDeleting(false); }
  }

  async function handleAltSave() {
    setSaving(true);
    await onAltSave(item._id, alt);
    setSaving(false);
    setEditing(false);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: deleting ? 0.3 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88 }}
      transition={{ type: "spring", stiffness: 340, damping: 26 }}
      className={`group relative rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer
        ${selected
          ? "border-[#7A2267] ring-2 ring-[#7A2267]/40"
          : "border-white/8 hover:border-white/20"
        }`}
      onClick={() => onSelect(item)}
    >
      {/* Image */}
      <div className="aspect-square bg-white/4">
        <img
          src={item.url}
          alt={item.alt || item.originalName}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Selection indicator */}
      {selected && (
        <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-[#7A2267] flex items-center justify-center shadow-lg">
          <svg viewBox="0 0 10 10" width="10" height="10" fill="none">
            <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/55 transition-colors duration-200
        flex flex-col justify-end opacity-0 group-hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-2.5 space-y-1.5">
          {/* File name */}
          <p className="text-[10px] text-white/70 truncate leading-tight">{item.originalName}</p>
          <p className="text-[9px] text-white/40">{formatBytes(item.size)}</p>

          {/* Alt text edit */}
          {editing ? (
            <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
              <input
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="Alt text…"
                className="flex-1 text-[10px] bg-black/60 border border-white/20 rounded-lg px-2 py-1
                  text-white placeholder-white/30 focus:outline-none focus:border-[#7A2267]/60"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleAltSave()}
              />
              <button
                onClick={handleAltSave}
                disabled={saving}
                className="text-[9px] px-2 py-1 rounded-lg bg-[#7A2267] text-white disabled:opacity-50"
              >
                {saving ? "…" : "Save"}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); setEditing(true); }}
                className="text-[9.5px] text-white/45 hover:text-white/80 transition-colors"
              >
                {item.alt ? "Edit alt" : "+ Alt text"}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                disabled={deleting}
                className="text-[9.5px] text-red-400/60 hover:text-red-400 transition-colors disabled:opacity-40"
              >
                {deleting ? "…" : "Delete"}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function MediaLibrary({ initialData }) {
  const [data, setData]           = useState(initialData);
  const [selected, setSelected]   = useState(new Set());
  const [isPending, startTrans]   = useTransition();
  const [delError, setDelError]   = useState("");

  async function refresh() {
    const fresh = await getMedia({ page: data.page, limit: data.limit });
    setData(fresh);
  }

  function toggleSelect(item) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(item._id) ? next.delete(item._id) : next.add(item._id);
      return next;
    });
  }

  async function handleDelete(id) {
    setDelError("");
    await deleteMedia(id);
    setData((prev) => ({ ...prev, items: prev.items.filter((i) => i._id !== id), total: prev.total - 1 }));
    setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
  }

  function handleBulkDelete() {
    if (!selected.size) return;
    setDelError("");
    startTrans(async () => {
      try {
        await deleteMediaBulk([...selected]);
        setData((prev) => ({
          ...prev,
          items: prev.items.filter((i) => !selected.has(i._id)),
          total: prev.total - selected.size,
        }));
        setSelected(new Set());
      } catch (err) {
        setDelError(err.message || "Bulk delete failed.");
      }
    });
  }

  async function handleAltSave(id, alt) {
    await updateMediaAlt(id, alt);
    setData((prev) => ({
      ...prev,
      items: prev.items.map((i) => i._id === id ? { ...i, alt } : i),
    }));
  }

  async function loadPage(p) {
    const fresh = await getMedia({ page: p, limit: data.limit });
    setData(fresh);
    setSelected(new Set());
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[18px] font-semibold text-white/85 leading-tight">Media Library</h2>
          <p className="text-[11.5px] text-white/30 mt-0.5">{data.total} file{data.total !== 1 ? "s" : ""}</p>
        </div>
        <AnimatePresence>
          {selected.size > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-3"
            >
              <span className="text-[11.5px] text-white/40">{selected.size} selected</span>
              <button
                onClick={() => setSelected(new Set())}
                className="text-[11.5px] text-white/30 hover:text-white/60 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isPending}
                className="px-4 py-1.5 rounded-xl bg-red-500/15 border border-red-500/25
                  text-[11.5px] text-red-400 hover:bg-red-500/25 disabled:opacity-50 transition-all"
              >
                {isPending ? "Deleting…" : `Delete ${selected.size}`}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Upload zone */}
      <UploadZone onUploaded={refresh} />

      {/* Error */}
      <AnimatePresence>
        {delError && (
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-[11.5px] text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg"
          >
            {delError}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Grid */}
      {data.items.length === 0 ? (
        <div className="text-center py-20 text-white/20 text-[13px]">
          No media yet. Upload your first image above.
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3"
        >
          <AnimatePresence mode="popLayout">
            {data.items.map((item) => (
              <MediaCard
                key={item._id}
                item={item}
                selected={selected.has(item._id)}
                onSelect={toggleSelect}
                onDelete={handleDelete}
                onAltSave={handleAltSave}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Pagination */}
      {data.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => loadPage(p)}
              className={`w-8 h-8 rounded-lg text-[11.5px] transition-all duration-200
                ${p === data.page
                  ? "bg-[#7A2267] text-white"
                  : "bg-white/4 text-white/40 hover:bg-white/8 hover:text-white/70"
                }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
