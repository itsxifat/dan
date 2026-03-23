"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getMedia } from "@/actions/admin/mediaActions";

const EASE = [0.16, 1, 0.3, 1];

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * MediaPicker — modal for selecting images from the media library or uploading new ones.
 *
 * Props:
 *   open       – boolean
 *   onClose    – () => void
 *   onSelect   – (url: string) => void    (single pick)
 *   onSelectMultiple – (urls: string[]) => void   (multi pick — enables multi mode)
 *   multiple   – boolean (default false)
 */
export default function MediaPicker({ open, onClose, onSelect, onSelectMultiple, multiple = false }) {
  const [tab, setTab]           = useState("library"); // "library" | "upload"
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [page, setPage]         = useState(1);
  const [totalPages, setTotal]  = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch]     = useState("");

  const [uploading, setUploading] = useState(false);
  const [upProgress, setUpProg]   = useState([]);
  const inputRef = useRef(null);

  async function fetchLibrary(p = 1) {
    setLoading(true);
    try {
      const data = await getMedia({ page: p, limit: 40 });
      setItems(data.items);
      setPage(data.page);
      setTotal(data.pages);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      setSelected(new Set());
      setTab("library");
      fetchLibrary(1);
    }
  }, [open]);

  function toggleItem(item) {
    if (!multiple) {
      // Single mode: select and close
      onSelect?.(item.url);
      onClose();
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(item._id) ? next.delete(item._id) : next.add(item._id);
      return next;
    });
  }

  function confirmMultiple() {
    const urls = items.filter((i) => selected.has(i._id)).map((i) => i.url);
    onSelectMultiple?.(urls);
    onClose();
  }

  const uploadFile = useCallback(async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    const res  = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data;
  }, []);

  async function handleUpload(files) {
    if (!files.length) return;
    setUploading(true);
    setUpProg(files.map((f) => ({ name: f.name, status: "uploading" })));

    const results = await Promise.allSettled(
      files.map((file, i) =>
        uploadFile(file).then((data) => {
          setUpProg((prev) => {
            const next = [...prev];
            next[i] = { ...next[i], status: "done", url: data.url };
            return next;
          });
          return data;
        }).catch((err) => {
          setUpProg((prev) => {
            const next = [...prev];
            next[i] = { ...next[i], status: "error", msg: err.message };
            return next;
          });
        })
      )
    );

    setUploading(false);
    const uploaded = results.filter((r) => r.status === "fulfilled" && r.value);
    if (uploaded.length) {
      // Refresh library and switch to it
      await fetchLibrary(1);
      setTab("library");
      setTimeout(() => setUpProg([]), 1500);
    }
  }

  const filtered = search.trim()
    ? items.filter((i) =>
        i.originalName.toLowerCase().includes(search.toLowerCase()) ||
        (i.alt || "").toLowerCase().includes(search.toLowerCase())
      )
    : items;

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="picker-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="relative z-10 w-full sm:max-w-4xl bg-[#111] border border-white/10
            rounded-t-3xl sm:rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.8)]
            flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/6 shrink-0">
            <div>
              <h3 className="text-[13px] font-semibold text-white/80">
                {multiple ? "Select Images" : "Select Image"}
              </h3>
              {multiple && selected.size > 0 && (
                <p className="text-[10.5px] text-white/35 mt-0.5">{selected.size} selected</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {multiple && selected.size > 0 && (
                <button
                  onClick={confirmMultiple}
                  className="px-4 py-1.5 rounded-xl bg-[#7A2267] text-white text-[11.5px] font-semibold
                    hover:bg-[#8e2878] transition-colors"
                >
                  Insert {selected.size}
                </button>
              )}
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/6 flex items-center justify-center
                  text-white/40 hover:text-white/80 hover:bg-white/10 transition-all"
              >
                <svg viewBox="0 0 10 10" width="10" height="10" fill="none">
                  <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-5 pt-3 pb-0 shrink-0">
            {["library", "upload"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative px-4 py-1.5 text-[11.5px] font-medium capitalize rounded-full transition-all
                  ${tab === t ? "text-white bg-white/8" : "text-white/35 hover:text-white/60"}`}
              >
                {t === "library" ? `Library (${items.length})` : "Upload New"}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 min-h-0">
            {tab === "library" && (
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <svg viewBox="0 0 16 16" width="13" height="13" fill="none"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none">
                    <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or alt text…"
                    className="w-full bg-white/4 border border-white/8 rounded-xl pl-8 pr-4 py-2.5
                      text-[12px] text-white placeholder-white/20 focus:outline-none focus:border-[#7A2267]/50
                      transition-all duration-200"
                  />
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-6 h-6 rounded-full border-2 border-white/10 border-t-[#7A2267]"
                    />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-16 text-white/25 text-[13px]">
                    {search ? "No matching images found." : "No media yet. Upload some files first."}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
                    {filtered.map((item) => {
                      const isSel = selected.has(item._id);
                      return (
                        <div
                          key={item._id}
                          onClick={() => toggleItem(item)}
                          className={`relative rounded-xl overflow-hidden cursor-pointer border transition-all duration-150
                            aspect-square group
                            ${isSel
                              ? "border-[#7A2267] ring-2 ring-[#7A2267]/40"
                              : "border-white/8 hover:border-white/25"
                            }`}
                        >
                          <img
                            src={item.url}
                            alt={item.alt || item.originalName}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {isSel && (
                            <div className="absolute inset-0 bg-[#7A2267]/25 flex items-center justify-center">
                              <div className="w-6 h-6 rounded-full bg-[#7A2267] flex items-center justify-center shadow-lg">
                                <svg viewBox="0 0 10 10" width="10" height="10" fill="none">
                                  <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </div>
                            </div>
                          )}
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-0 inset-x-0 bg-black/70 px-2 py-1
                            opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            <p className="text-[9px] text-white/70 truncate">{item.originalName}</p>
                            <p className="text-[8px] text-white/35">{formatBytes(item.size)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && !search && (
                  <div className="flex items-center justify-center gap-1.5 pt-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => fetchLibrary(p)}
                        className={`w-7 h-7 rounded-lg text-[11px] transition-all
                          ${p === page ? "bg-[#7A2267] text-white" : "bg-white/5 text-white/35 hover:bg-white/10 hover:text-white/60"}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "upload" && (
              <div className="space-y-4">
                <motion.div
                  onClick={() => !uploading && inputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const files = Array.from(e.dataTransfer.files || []).filter((f) => f.type.startsWith("image/"));
                    handleUpload(files);
                  }}
                  className="cursor-pointer rounded-2xl border-2 border-dashed border-white/10
                    hover:border-[#7A2267]/40 bg-white/[0.02] px-6 py-12 text-center
                    transition-colors duration-200"
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-6 h-6 rounded-full border-2 border-[#7A2267]/25 border-t-[#7A2267]"
                      />
                      <p className="text-[12px] text-white/35">Uploading…</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <svg viewBox="0 0 20 20" width="24" height="24" fill="none" className="text-white/25">
                        <path d="M10 3v10M7 6l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M3 15v1a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      <p className="text-[12.5px] text-white/40">Click or drag to upload images</p>
                      <p className="text-[10.5px] text-white/20">Uploaded files will appear in the library</p>
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
                      handleUpload(files);
                    }}
                  />
                </motion.div>

                {/* Progress */}
                {upProgress.length > 0 && (
                  <div className="space-y-1.5">
                    {upProgress.map((p, i) => (
                      <div key={i} className={`flex items-center gap-2.5 text-[11px] px-3 py-2 rounded-xl border
                        ${p.status === "done"  ? "border-emerald-500/20 bg-emerald-400/5 text-emerald-400" :
                          p.status === "error" ? "border-red-500/20 bg-red-400/5 text-red-400"            :
                          "border-white/8 bg-white/3 text-white/40"}`}
                      >
                        <span className="shrink-0 w-3 h-3 flex items-center justify-center">
                          {p.status === "uploading" && (
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                              className="inline-block w-3 h-3 rounded-full border border-current border-t-transparent"
                            />
                          )}
                          {p.status === "done"  && "✓"}
                          {p.status === "error" && "✕"}
                        </span>
                        <span className="flex-1 truncate">{p.name}</span>
                        {p.status === "error" && p.msg && (
                          <span className="shrink-0 text-[10px] opacity-60">{p.msg}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
