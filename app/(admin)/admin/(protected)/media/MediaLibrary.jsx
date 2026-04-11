"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getMedia, deleteMedia, deleteMediaBulk, updateMediaAlt,
  getFolders, createFolder, moveMediaToFolder, copyMediaToFolder,
  renameFolder as renameFolderAction, deleteFolder as deleteFolderAction,
} from "@/actions/admin/mediaActions";

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatBytes(b) {
  if (!b) return "0 B";
  if (b < 1024)    return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

// ─── Icons (inline SVG helpers) ───────────────────────────────────────────────

const Icon = {
  folder: (cls) => (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" className={cls}>
      <path d="M1.5 5.5A1.5 1.5 0 013 4h3.086a1 1 0 01.707.293L8 5.5H13A1.5 1.5 0 0114.5 7V12A1.5 1.5 0 0113 13.5H3A1.5 1.5 0 011.5 12V5.5z"
        stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
  ),
  folderFilled: (cls) => (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" className={cls}>
      <path d="M1.5 5.5A1.5 1.5 0 013 4h3.086a1 1 0 01.707.293L8 5.5H13A1.5 1.5 0 0114.5 7V12A1.5 1.5 0 0113 13.5H3A1.5 1.5 0 011.5 12V5.5z"
        stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.15" />
    </svg>
  ),
  plus: (cls) => (
    <svg viewBox="0 0 12 12" width="10" height="10" fill="none" className={cls}>
      <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  x: (cls) => (
    <svg viewBox="0 0 10 10" width="9" height="9" fill="none" className={cls}>
      <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  check: (cls) => (
    <svg viewBox="0 0 10 10" width="9" height="9" fill="none" className={cls}>
      <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  search: (cls) => (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" className={cls}>
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  upload: (cls) => (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" className={cls}>
      <path d="M10 3v10M7 6l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 15v1a1 1 0 001 1h12a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  grid: (cls) => (
    <svg viewBox="0 0 14 14" width="13" height="13" fill="none" className={cls}>
      <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  allFiles: (cls) => (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" className={cls}>
      <rect x="1" y="2.5" width="14" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="4.5" cy="7.5" r="1.2" stroke="currentColor" strokeWidth="1" />
      <path d="M1 11l3.5-3 2.5 2 2-1.5 4 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  edit: (cls) => (
    <svg viewBox="0 0 12 12" width="10" height="10" fill="none" className={cls}>
      <path d="M8.5 1.5a1.2 1.2 0 011.7 1.7L3.8 9.6 1 10.4l.8-2.8L8.5 1.5z"
        stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  trash: (cls) => (
    <svg viewBox="0 0 12 12" width="10" height="10" fill="none" className={cls}>
      <path d="M1 3h10M4 3V2h4v1M5 5.5v3M7 5.5v3M2 3l.8 7.2A1 1 0 003.8 11h4.4a1 1 0 001-.8L10 3"
        stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  copy: (cls) => (
    <svg viewBox="0 0 14 14" width="11" height="11" fill="none" className={cls}>
      <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 10V2.5A.5.5 0 012.5 2H10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  cut: (cls) => (
    <svg viewBox="0 0 14 14" width="11" height="11" fill="none" className={cls}>
      <circle cx="3" cy="11" r="1.8" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="11" cy="11" r="1.8" stroke="currentColor" strokeWidth="1.2" />
      <path d="M3 9.2L8 3.5M11 9.2L6 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  move: (cls) => (
    <svg viewBox="0 0 14 14" width="11" height="11" fill="none" className={cls}>
      <path d="M9 4l3 3-3 3M2 7h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  chevronDown: (cls) => (
    <svg viewBox="0 0 10 10" width="9" height="9" fill="none" className={cls}>
      <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

// ─── UploadZone ───────────────────────────────────────────────────────────────

function UploadZone({ folder, onUploaded, collapsed, onToggle }) {
  const [dragging, setDragging]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState([]);
  const fileInputRef = useRef(null);
  const targetFolder = folder || "general";

  async function uploadOne(file, index) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", targetFolder);
    const res  = await fetch("/api/upload", { method: "POST", body: fd });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Upload failed");
    return json;
  }

  async function handleFiles(files) {
    const imgs = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!imgs.length) return;
    setUploading(true);
    setProgress(imgs.map(f => ({ name: f.name, status: "uploading" })));

    let anyOk = false;
    await Promise.allSettled(imgs.map((file, i) =>
      uploadOne(file, i)
        .then(() => {
          anyOk = true;
          setProgress(p => { const n = [...p]; n[i] = { name: file.name, status: "done" }; return n; });
        })
        .catch(err => {
          setProgress(p => { const n = [...p]; n[i] = { name: file.name, status: "error", msg: err.message }; return n; });
        })
    ));

    setUploading(false);
    if (anyOk) onUploaded();
    setTimeout(() => setProgress([]), 3000);
  }

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
      {/* Collapsible header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-4 py-3
          text-white/40 hover:text-white/65 transition-colors duration-150"
      >
        <div className="flex items-center gap-2">
          {Icon.upload("text-white/30")}
          <span className="text-[12px] font-medium">
            Upload to{" "}
            <span className="text-[#7A2267]/70 font-semibold">{targetFolder}</span>
          </span>
        </div>
        <motion.span animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.2 }}>
          {Icon.chevronDown("text-white/25")}
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
                className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center select-none
                  transition-colors duration-200
                  ${dragging ? "border-[#7A2267]/60 bg-[#7A2267]/5" : "border-white/8 hover:border-[#7A2267]/30 bg-white/[0.012]"}`}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-6 h-6 rounded-full border-2 border-[#7A2267]/25 border-t-[#7A2267]" />
                    <p className="text-[12px] text-white/40">Uploading {progress.length} file{progress.length !== 1 ? "s" : ""}…</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-white/4 border border-white/8 flex items-center justify-center">
                      {Icon.upload("text-white/30")}
                    </div>
                    <p className="text-[12.5px] font-medium text-white/45">
                      {dragging ? "Drop to upload" : "Click or drag images here"}
                    </p>
                    <p className="text-[10.5px] text-white/22">
                      PNG · JPG · WebP · GIF · AVIF &nbsp;·&nbsp; max 10 MB
                    </p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={e => { handleFiles(e.target.files); e.target.value = ""; }} />
              </div>

              {/* Progress pills */}
              <AnimatePresence>
                {progress.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="flex flex-wrap gap-1.5">
                      {progress.map((p, i) => (
                        <span key={i} className={`flex items-center gap-1.5 text-[10.5px] px-2.5 py-1 rounded-full border
                          ${p.status === "done"  ? "border-emerald-500/30 text-emerald-400 bg-emerald-400/8" :
                            p.status === "error" ? "border-red-500/30 text-red-400 bg-red-400/8" :
                            "border-white/10 text-white/35 bg-white/4"}`}>
                          {p.status === "uploading" && (
                            <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                              className="w-2.5 h-2.5 rounded-full border border-current border-t-transparent inline-block" />
                          )}
                          {p.status === "done"  && "✓"}
                          {p.status === "error" && "✕"}
                          <span className="max-w-[120px] truncate">{p.name}</span>
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── FolderItem ───────────────────────────────────────────────────────────────

function FolderItem({ folder, active, dragActive, onSelect, onRename, onDelete, onDrop }) {
  const [renaming, setRenaming]   = useState(false);
  const [val, setVal]             = useState(folder.name);
  const [dragOver, setDragOver]   = useState(false);
  const [dropBusy, setDropBusy]   = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { if (renaming) setTimeout(() => inputRef.current?.focus(), 20); }, [renaming]);

  function commit() {
    const name = val.trim();
    if (name && name !== folder.name) onRename(folder.name, name);
    else setVal(folder.name);
    setRenaming(false);
  }

  async function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const raw = e.dataTransfer.getData("text/plain");
    if (!raw) return;
    try {
      const ids = JSON.parse(raw);
      if (Array.isArray(ids) && ids.length) {
        setDropBusy(true);
        await onDrop(ids, folder.name);
        setDropBusy(false);
      }
    } catch { /* ignore bad JSON */ }
  }

  if (renaming) {
    return (
      <div className="flex gap-1 px-1 py-0.5">
        <input ref={inputRef} value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setVal(folder.name); setRenaming(false); } }}
          onBlur={commit}
          className="flex-1 min-w-0 text-[11.5px] bg-white/6 border border-[#7A2267]/40 rounded-lg px-2 py-1.5
            text-white focus:outline-none" />
      </div>
    );
  }

  const isDropTarget = dragActive && !active;

  return (
    <div
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`relative group rounded-xl transition-all duration-150
        ${isDropTarget && dragOver
          ? "ring-2 ring-[#7A2267]/60 bg-[#7A2267]/12"
          : isDropTarget
          ? "ring-1 ring-[#7A2267]/25 bg-[#7A2267]/5"
          : ""}`}
    >
      <button
        onClick={onSelect}
        className={`w-full flex items-center justify-between gap-1 px-3 py-2 rounded-xl text-[12px] transition-all duration-150
          ${active
            ? "bg-[#7A2267]/15 text-white border border-[#7A2267]/30"
            : "text-white/45 hover:bg-white/5 hover:text-white/75 border border-transparent"}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {active
            ? Icon.folderFilled(`text-[#7A2267]/80 shrink-0`)
            : Icon.folder(`${isDropTarget && dragOver ? "text-[#7A2267]/70" : "text-white/30"} shrink-0`)}
          <span className="truncate">{folder.name}</span>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          {dropBusy
            ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                className="w-3 h-3 rounded-full border border-[#7A2267]/50 border-t-[#7A2267] inline-block mr-1" />
            : <span className="text-[10px] text-white/25 mr-0.5">{folder.count || 0}</span>
          }

          {folder.name !== "general" && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <span role="button" title="Rename"
                onClick={e => { e.stopPropagation(); setVal(folder.name); setRenaming(true); }}
                className="w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-white/80 hover:bg-white/8 transition-all">
                {Icon.edit()}
              </span>
              <span role="button" title="Delete folder — images move to General"
                onClick={e => { e.stopPropagation(); onDelete(folder.name); }}
                className="w-5 h-5 flex items-center justify-center rounded text-red-400/40 hover:text-red-400 hover:bg-red-400/8 transition-all">
                {Icon.x()}
              </span>
            </div>
          )}
        </div>
      </button>

      {/* Drop hint label */}
      {isDropTarget && dragOver && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl">
          <span className="text-[10px] font-semibold text-[#7A2267]/90 bg-[#7A2267]/15 px-2 py-0.5 rounded-full">
            Drop to move here
          </span>
        </div>
      )}
    </div>
  );
}

// ─── FolderSidebar ────────────────────────────────────────────────────────────

function FolderSidebar({ folders, activeFolder, totalCount, dragActive,
  onSelect, onCreate, onRename, onDelete, onDrop }) {
  const [creating, setCreating]     = useState(false);
  const [newName, setNewName]       = useState("");
  const [createBusy, setCreateBusy] = useState(false);
  const [createErr, setCreateErr]   = useState("");
  const inputRef = useRef(null);

  useEffect(() => { if (creating) setTimeout(() => inputRef.current?.focus(), 30); }, [creating]);

  async function submitCreate() {
    const name = newName.trim();
    if (!name) return;
    setCreateBusy(true);
    setCreateErr("");
    try {
      await onCreate(name);
      setNewName("");
      setCreating(false);
    } catch (e) {
      setCreateErr(e.message || "Failed to create folder");
    } finally {
      setCreateBusy(false);
    }
  }

  return (
    <nav className="shrink-0 space-y-0.5">
      <p className="text-[10px] font-semibold text-white/18 uppercase tracking-widest px-3 pb-2">
        Folders
      </p>

      {/* All Files */}
      <button
        onClick={() => onSelect(null)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-[12px] mb-0.5 transition-all
          ${!activeFolder
            ? "bg-white/8 text-white border border-white/10"
            : "text-white/45 hover:bg-white/5 hover:text-white/75 border border-transparent"}`}
      >
        <div className="flex items-center gap-2">
          {Icon.allFiles("text-white/35 shrink-0")}
          <span>All Files</span>
        </div>
        <span className="text-[10px] text-white/25">{totalCount}</span>
      </button>

      <div className="h-px bg-white/5 mx-2 my-1.5" />

      {/* Folder list */}
      <div className="space-y-0.5">
        {folders.map(f => (
          <FolderItem
            key={f.name}
            folder={f}
            active={activeFolder === f.name}
            dragActive={dragActive}
            onSelect={() => onSelect(f.name)}
            onRename={onRename}
            onDelete={onDelete}
            onDrop={onDrop}
          />
        ))}
      </div>

      {/* Create folder */}
      <div className="mt-1 pt-1 border-t border-white/5">
        {creating ? (
          <div className="space-y-1.5 px-1 py-1">
            <input
              ref={inputRef}
              value={newName}
              onChange={e => { setNewName(e.target.value); setCreateErr(""); }}
              onKeyDown={e => {
                if (e.key === "Enter") submitCreate();
                if (e.key === "Escape") { setCreating(false); setNewName(""); setCreateErr(""); }
              }}
              placeholder="Folder name…"
              disabled={createBusy}
              className="w-full text-[11.5px] bg-white/5 border border-white/12 rounded-lg px-2.5 py-1.5
                text-white placeholder-white/20 focus:outline-none focus:border-[#7A2267]/50 disabled:opacity-50"
            />
            {createErr && <p className="text-[10px] text-red-400 px-0.5">{createErr}</p>}
            <div className="flex gap-1.5">
              <button onClick={submitCreate} disabled={createBusy || !newName.trim()}
                className="flex-1 text-[11px] py-1.5 rounded-lg bg-[#7A2267] text-white font-medium
                  disabled:opacity-40 hover:bg-[#8e2878] transition-colors">
                {createBusy ? "Creating…" : "Create"}
              </button>
              <button onClick={() => { setCreating(false); setNewName(""); setCreateErr(""); }}
                className="px-3 text-[11px] py-1.5 rounded-lg bg-white/5 text-white/50 hover:bg-white/8 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-[11.5px]
              text-white/25 hover:text-white/55 hover:bg-white/4 rounded-xl transition-all"
          >
            {Icon.plus()}
            New Folder
          </button>
        )}
      </div>

      {/* Drag hint */}
      <AnimatePresence>
        {dragActive && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="mt-2 mx-1 px-3 py-2 rounded-xl bg-[#7A2267]/8 border border-[#7A2267]/20 text-center"
          >
            <p className="text-[10px] text-[#7A2267]/70">Drop onto a folder to move</p>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ─── MediaCard ────────────────────────────────────────────────────────────────

function MediaCard({ item, selected, inClipboard, clipMode, gridSize, isDragging,
  onSelect, onDelete, onAltSave, onDragStart, onDragEnd }) {
  const [editing, setEditing]     = useState(false);
  const [alt, setAlt]             = useState(item.alt || "");
  const [deleting, setDeleting]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [copied, setCopied]       = useState(false);

  async function handleDelete(e) {
    e.stopPropagation();
    setDeleting(true);
    try { await onDelete(item._id); } catch { setDeleting(false); }
  }

  async function handleAltSave() {
    setSaving(true);
    await onAltSave(item._id, alt);
    setSaving(false);
    setEditing(false);
  }

  function handleCopyUrl(e) {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.origin + item.url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const dimmed = inClipboard && clipMode === "cut";

  const sizeClass = {
    sm: "col-span-1",
    md: "col-span-1",
    lg: "col-span-1",
  }[gridSize] || "col-span-1";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.93 }}
      animate={{ opacity: deleting ? 0.2 : dimmed ? 0.35 : isDragging ? 0.6 : 1, scale: isDragging ? 0.97 : 1 }}
      exit={{ opacity: 0, scale: 0.88 }}
      transition={{ type: "spring", stiffness: 340, damping: 26 }}
      draggable
      onDragStart={e => onDragStart(e, item)}
      onDragEnd={onDragEnd}
      onClick={() => onSelect(item)}
      className={`group relative rounded-xl overflow-hidden border cursor-pointer
        transition-all duration-200 select-none
        ${selected
          ? "border-[#7A2267] ring-2 ring-[#7A2267]/40"
          : inClipboard && clipMode === "copy"
          ? "border-blue-400/40 ring-1 ring-blue-400/20"
          : "border-white/8 hover:border-white/20"}`}
    >
      {/* Image */}
      <div className={`bg-white/4 ${gridSize === "lg" ? "aspect-[4/3]" : "aspect-square"}`}>
        <img
          src={item.url}
          alt={item.alt || item.originalName}
          className="w-full h-full object-cover"
          loading="lazy"
          draggable={false}
        />
      </div>

      {/* Selection tick */}
      {selected && (
        <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-[#7A2267] flex items-center justify-center shadow-lg z-10">
          {Icon.check("text-white")}
        </div>
      )}

      {/* Clipboard badge */}
      {inClipboard && !selected && (
        <div className={`absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center z-10
          ${clipMode === "cut" ? "bg-amber-500" : "bg-blue-500"}`}>
          {clipMode === "cut" ? Icon.cut("text-white w-3 h-3") : Icon.copy("text-white w-3 h-3")}
        </div>
      )}

      {/* Folder badge (in all-files view) */}
      {item.folder && item.folder !== "general" && (
        <div className="absolute top-2 right-2 bg-black/65 backdrop-blur-sm rounded px-1.5 py-0.5 z-10">
          <p className="text-[8px] text-[#7A2267]/80 truncate max-w-[60px] leading-none">{item.folder}</p>
        </div>
      )}

      {/* Hover overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent
          opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-2.5 space-y-1.5">
          <p className="text-[10px] text-white/75 truncate leading-snug">{item.originalName}</p>
          <p className="text-[9px] text-white/40">{formatBytes(item.size)}</p>

          {editing ? (
            <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
              <input
                value={alt}
                onChange={e => setAlt(e.target.value)}
                placeholder="Alt text…"
                autoFocus
                onKeyDown={e => e.key === "Enter" && handleAltSave()}
                className="flex-1 text-[10px] bg-black/60 border border-white/20 rounded px-2 py-1
                  text-white placeholder-white/30 focus:outline-none focus:border-[#7A2267]/60"
              />
              <button onClick={handleAltSave} disabled={saving}
                className="text-[9px] px-2 py-1 rounded bg-[#7A2267] text-white disabled:opacity-50">
                {saving ? "…" : "Save"}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-2">
                <button onClick={e => { e.stopPropagation(); setEditing(true); }}
                  className="text-[9px] text-white/40 hover:text-white/75 transition-colors">
                  {item.alt ? "Edit alt" : "+ Alt"}
                </button>
                <button onClick={handleCopyUrl}
                  className="text-[9px] text-white/40 hover:text-white/75 transition-colors">
                  {copied ? "✓ Copied" : "Copy URL"}
                </button>
              </div>
              <button onClick={handleDelete} disabled={deleting}
                className="text-[9px] text-red-400/60 hover:text-red-400 transition-colors disabled:opacity-40">
                {deleting ? "…" : "Delete"}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── BulkActionBar ────────────────────────────────────────────────────────────

function BulkActionBar({ count, folders, moveTarget, busy, onClear,
  onCopy, onCut, onMove, onDelete, onMoveTargetChange }) {
  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 60, opacity: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-2 flex-wrap justify-center
        bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-2xl
        px-4 py-2.5 shadow-2xl shadow-black/50
        max-w-[calc(100vw-2rem)]"
    >
      {/* Count + clear */}
      <div className="flex items-center gap-2">
        <span className="text-[11.5px] font-semibold text-white/80">{count} selected</span>
        <button onClick={onClear}
          className="text-[10.5px] text-white/30 hover:text-white/60 transition-colors">
          Clear
        </button>
      </div>

      <div className="w-px h-4 bg-white/12 shrink-0" />

      {/* Copy */}
      <button onClick={onCopy} title="Ctrl+C"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20
          text-[11px] text-blue-300/80 hover:bg-blue-500/18 transition-all">
        {Icon.copy()}
        Copy
      </button>

      {/* Cut */}
      <button onClick={onCut} title="Ctrl+X"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20
          text-[11px] text-amber-300/80 hover:bg-amber-500/18 transition-all">
        {Icon.cut()}
        Cut
      </button>

      <div className="w-px h-4 bg-white/12 shrink-0" />

      {/* Quick move */}
      <div className="flex items-center gap-1.5">
        <select
          value={moveTarget}
          onChange={e => onMoveTargetChange(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl text-[11px] text-white/55
            px-2.5 py-1.5 focus:outline-none focus:border-[#7A2267]/40 cursor-pointer max-w-[120px]"
        >
          <option value="">Move to…</option>
          {folders.map(f => (
            <option key={f.name} value={f.name}>{f.name}</option>
          ))}
        </select>
        {moveTarget && (
          <button onClick={onMove} disabled={busy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl
              bg-[#7A2267]/20 border border-[#7A2267]/30 text-[11px] text-[#7A2267]/90
              hover:bg-[#7A2267]/30 disabled:opacity-50 transition-all">
            {Icon.move()}
            {busy ? "…" : "Move"}
          </button>
        )}
      </div>

      <div className="w-px h-4 bg-white/12 shrink-0" />

      {/* Delete */}
      <button onClick={onDelete} disabled={busy}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl
          bg-red-500/12 border border-red-500/22 text-[11px] text-red-400
          hover:bg-red-500/22 disabled:opacity-50 transition-all">
        {Icon.trash()}
        {busy ? "Deleting…" : `Delete ${count}`}
      </button>
    </motion.div>
  );
}

// ─── Main MediaLibrary ────────────────────────────────────────────────────────

const GRID_COLS = {
  sm: "grid-cols-4 sm:grid-cols-6 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10",
  md: "grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
  lg: "grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
};

export default function MediaLibrary({ initialData, initialFolders }) {
  const [data, setData]           = useState(initialData);
  const [folders, setFolders]     = useState(initialFolders);
  const [activeFolder, setActiveFolder] = useState(null);
  const [selected, setSelected]   = useState(new Set());
  const [moveTarget, setMoveTarget] = useState("");
  const [search, setSearch]       = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [gridSize, setGridSize]   = useState("md");
  const [uploadCollapsed, setUploadCollapsed] = useState(false);
  const [folderPanelOpen, setFolderPanelOpen] = useState(false); // mobile

  // Clipboard
  const [clipboard, setClipboard] = useState(null);
  const [pasteMsg, setPasteMsg]   = useState("");

  // Drag state
  const [dragActive, setDragActive]   = useState(false);
  const [draggingIds, setDraggingIds] = useState([]);

  // Operation state
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState("");

  // ── Data loaders ──────────────────────────────────────────────────────────

  const loadFolders = useCallback(async () => {
    const fresh = await getFolders();
    setFolders(fresh);
    return fresh;
  }, []);

  const loadMedia = useCallback(async (folder, page = 1, q = search) => {
    const fresh = await getMedia({ page, limit: data.limit, folder, search: q });
    setData(fresh);
    return fresh;
  }, [data.limit, search]);

  async function reload(folder, page = 1, q = search) {
    await Promise.all([loadFolders(), loadMedia(folder, page, q)]);
  }

  // ── Search ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== search) {
        setSearch(searchInput);
        loadMedia(activeFolder, 1, searchInput);
      }
    }, 350);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // ── Folder actions ────────────────────────────────────────────────────────

  async function handleFolderSelect(name) {
    setActiveFolder(name);
    setSelected(new Set());
    setError("");
    await loadMedia(name, 1, search);
  }

  async function handleCreateFolder(name) {
    const created = await createFolder(name);
    await loadFolders();
    setActiveFolder(created);
    await loadMedia(created, 1, search);
    setFolderPanelOpen(false);
  }

  async function handleRenameFolder(oldName, newName) {
    setError("");
    try {
      await renameFolderAction(oldName, newName);
      if (activeFolder === oldName) setActiveFolder(newName);
      await reload(activeFolder === oldName ? newName : activeFolder);
    } catch (e) { setError(e.message || "Rename failed"); }
  }

  async function handleDeleteFolder(name) {
    setError("");
    try {
      await deleteFolderAction(name);
      const nextFolder = activeFolder === name ? null : activeFolder;
      setActiveFolder(nextFolder);
      await reload(nextFolder);
    } catch (e) { setError(e.message || "Delete failed"); }
  }

  // ── Drag to folder ────────────────────────────────────────────────────────

  function handleCardDragStart(e, item) {
    const ids = selected.has(item._id) ? [...selected] : [item._id];
    setDraggingIds(ids);
    setDragActive(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify(ids));
  }

  function handleCardDragEnd() {
    setDragActive(false);
    setDraggingIds([]);
  }

  async function handleDropOnFolder(ids, folderName) {
    if (!ids.length) return;
    setError("");
    try {
      await moveMediaToFolder(ids, folderName);
      setSelected(prev => {
        const next = new Set(prev);
        ids.forEach(id => next.delete(id));
        return next;
      });
      await reload(activeFolder);
    } catch (e) { setError(e.message || "Move failed"); }
  }

  // ── Selection ─────────────────────────────────────────────────────────────

  function toggleSelect(item) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(item._id) ? next.delete(item._id) : next.add(item._id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === data.items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(data.items.map(i => i._id)));
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete(id) {
    setError("");
    await deleteMedia(id);
    setData(prev => ({ ...prev, items: prev.items.filter(i => i._id !== id), total: prev.total - 1 }));
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
    await loadFolders();
  }

  async function handleBulkDelete() {
    if (!selected.size || busy) return;
    setError("");
    setBusy(true);
    try {
      const ids = [...selected];
      await deleteMediaBulk(ids);
      setData(prev => ({
        ...prev,
        items: prev.items.filter(i => !selected.has(i._id)),
        total: prev.total - selected.size,
      }));
      setSelected(new Set());
      await loadFolders();
    } catch (e) { setError(e.message || "Delete failed"); }
    finally { setBusy(false); }
  }

  // ── Move ──────────────────────────────────────────────────────────────────

  async function handleBulkMove() {
    if (!selected.size || !moveTarget || busy) return;
    setError("");
    setBusy(true);
    try {
      await moveMediaToFolder([...selected], moveTarget);
      setSelected(new Set());
      setMoveTarget("");
      await reload(activeFolder);
    } catch (e) { setError(e.message || "Move failed"); }
    finally { setBusy(false); }
  }

  // ── Clipboard ─────────────────────────────────────────────────────────────

  function handleCopy() {
    if (!selected.size) return;
    setClipboard({ items: data.items.filter(i => selected.has(i._id)), mode: "copy" });
    setSelected(new Set());
    setPasteMsg("");
  }

  function handleCut() {
    if (!selected.size) return;
    setClipboard({ items: data.items.filter(i => selected.has(i._id)), mode: "cut" });
    setSelected(new Set());
    setPasteMsg("");
  }

  async function handlePaste() {
    if (!clipboard || busy) return;
    const target = activeFolder || "general";
    setError("");
    setBusy(true);
    try {
      const ids = clipboard.items.map(i => i._id);
      if (clipboard.mode === "cut") {
        await moveMediaToFolder(ids, target);
        setClipboard(null);
      } else {
        await copyMediaToFolder(ids, target);
      }
      await reload(activeFolder);
      const n    = clipboard.items.length;
      const verb = clipboard.mode === "cut" ? "Moved" : "Copied";
      setPasteMsg(`${verb} ${n} image${n !== 1 ? "s" : ""} → ${target}`);
      setTimeout(() => setPasteMsg(""), 3000);
    } catch (e) { setError(e.message || "Paste failed"); }
    finally { setBusy(false); }
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    function onKey(e) {
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === "c" && selected.size) { e.preventDefault(); handleCopy(); }
      if (mod && e.key === "x" && selected.size) { e.preventDefault(); handleCut(); }
      if (mod && e.key === "v" && clipboard)     { e.preventDefault(); handlePaste(); }
      if (mod && e.key === "a")                  { e.preventDefault(); toggleSelectAll(); }
      if (e.key === "Escape") { setSelected(new Set()); setClipboard(null); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ── Alt save ─────────────────────────────────────────────────────────────

  async function handleAltSave(id, alt) {
    await updateMediaAlt(id, alt);
    setData(prev => ({ ...prev, items: prev.items.map(i => i._id === id ? { ...i, alt } : i) }));
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const totalCount = folders.reduce((s, f) => s + (f.count || 0), 0);
  const clipIds    = new Set(clipboard?.items.map(i => i._id) || []);
  const allSelected = data.items.length > 0 && selected.size === data.items.length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex gap-0 h-full relative">

      {/* ── Mobile folder panel overlay ──────────────────────────────────────── */}
      <AnimatePresence>
        {folderPanelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFolderPanelOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-[#0d0d0d] border-r border-white/[0.07]
                z-40 lg:hidden overflow-y-auto p-4 pt-14"
            >
              <button onClick={() => setFolderPanelOpen(false)}
                className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg
                  bg-white/5 text-white/40 hover:text-white/70 transition-colors">
                {Icon.x()}
              </button>
              <FolderSidebar
                folders={folders}
                activeFolder={activeFolder}
                totalCount={totalCount}
                dragActive={dragActive}
                onSelect={name => { handleFolderSelect(name); setFolderPanelOpen(false); }}
                onCreate={handleCreateFolder}
                onRename={handleRenameFolder}
                onDelete={handleDeleteFolder}
                onDrop={handleDropOnFolder}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Desktop folder sidebar ────────────────────────────────────────────── */}
      <aside className="hidden lg:block w-48 shrink-0 pr-2">
        <FolderSidebar
          folders={folders}
          activeFolder={activeFolder}
          totalCount={totalCount}
          dragActive={dragActive}
          onSelect={handleFolderSelect}
          onCreate={handleCreateFolder}
          onRename={handleRenameFolder}
          onDelete={handleDeleteFolder}
          onDrop={handleDropOnFolder}
        />
      </aside>

      {/* ── Main content ──────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">

          {/* Mobile folder toggle */}
          <button
            onClick={() => setFolderPanelOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl
              bg-white/5 border border-white/8 text-[11.5px] text-white/50
              hover:text-white/80 hover:bg-white/8 transition-all shrink-0"
          >
            {Icon.folder("text-white/30")}
            {activeFolder || "All Files"}
          </button>

          {/* Search */}
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {Icon.search("text-white/25")}
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search images…"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl
                pl-8 pr-3 py-2 text-[12px] text-white placeholder-white/25
                focus:outline-none focus:border-[#7A2267]/40 transition-colors"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(""); setSearch(""); loadMedia(activeFolder, 1, ""); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60"
              >
                {Icon.x()}
              </button>
            )}
          </div>

          {/* Stats */}
          <span className="text-[11px] text-white/25 shrink-0 hidden sm:block">
            {data.total} file{data.total !== 1 ? "s" : ""}
            {activeFolder && <> · <span className="text-[#7A2267]/60">{activeFolder}</span></>}
          </span>

          <div className="flex-1" />

          {/* Select all */}
          {data.items.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] transition-all
                border ${allSelected
                  ? "bg-[#7A2267]/15 border-[#7A2267]/30 text-[#7A2267]/90"
                  : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white/70 hover:bg-white/[0.07]"}`}
            >
              <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center
                ${allSelected ? "bg-[#7A2267] border-[#7A2267]" : "border-white/20"}`}>
                {allSelected && Icon.check("text-white w-2.5 h-2.5")}
              </span>
              All
            </button>
          )}

          {/* Grid size toggle */}
          <div className="flex items-center gap-0.5 bg-white/[0.04] border border-white/[0.08] rounded-xl p-1">
            {["sm", "md", "lg"].map(size => (
              <button
                key={size}
                onClick={() => setGridSize(size)}
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all
                  ${gridSize === size ? "bg-white/10 text-white/80" : "text-white/25 hover:text-white/50"}`}
                title={{ sm: "Small", md: "Medium", lg: "Large" }[size]}
              >
                {size === "sm" && (
                  <svg viewBox="0 0 12 12" width="11" height="11" fill="none">
                    <rect x="0.5" y="0.5" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1"/>
                    <rect x="7.5" y="0.5" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1"/>
                    <rect x="0.5" y="7.5" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1"/>
                    <rect x="7.5" y="7.5" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1"/>
                  </svg>
                )}
                {size === "md" && Icon.grid()}
                {size === "lg" && (
                  <svg viewBox="0 0 12 12" width="11" height="11" fill="none">
                    <rect x="0.5" y="0.5" width="5" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.1"/>
                    <rect x="6.5" y="0.5" width="5" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.1"/>
                    <rect x="0.5" y="6.5" width="5" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.1"/>
                    <rect x="6.5" y="6.5" width="5" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.1"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Clipboard banner */}
        <AnimatePresence>
          {(clipboard || pasteMsg) && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className={`flex items-center justify-between gap-4 px-4 py-2.5 rounded-xl border
                ${clipboard?.mode === "cut"
                  ? "bg-amber-500/8 border-amber-500/20"
                  : "bg-blue-500/8 border-blue-500/20"}`}
            >
              <div className="flex items-center gap-2.5 min-w-0 text-[12px] text-white/60 truncate">
                {pasteMsg
                  ? <span className="text-emerald-400/80">✓ {pasteMsg}</span>
                  : <>
                      <strong className="text-white/75">{clipboard.items.length}</strong> image{clipboard.items.length !== 1 ? "s" : ""}{" "}
                      {clipboard.mode === "cut" ? "cut" : "copied"}{" · "}
                      {activeFolder
                        ? <>Navigate to a folder then <strong className="text-white/75">Paste here</strong></>
                        : "select a folder then paste"
                      }
                    </>
                }
                <kbd className="text-[9.5px] text-white/20 hidden sm:block">Ctrl+V</kbd>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!pasteMsg && activeFolder && (
                  <button
                    onClick={handlePaste}
                    disabled={busy}
                    className={`px-3.5 py-1.5 rounded-xl text-white text-[11.5px] font-medium transition-colors disabled:opacity-50
                      ${clipboard?.mode === "cut" ? "bg-amber-600 hover:bg-amber-500" : "bg-blue-600 hover:bg-blue-500"}`}
                  >
                    {busy ? "…" : "Paste here"}
                  </button>
                )}
                <button
                  onClick={() => { setClipboard(null); setPasteMsg(""); }}
                  className="w-6 h-6 flex items-center justify-center rounded text-white/25 hover:text-white/70 hover:bg-white/8 transition-all"
                >
                  {Icon.x()}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between gap-3 text-[11.5px] text-red-400
                bg-red-500/10 border border-red-500/20 px-3 py-2.5 rounded-xl"
            >
              <span>{error}</span>
              <button onClick={() => setError("")} className="shrink-0 text-red-400/50 hover:text-red-400">
                {Icon.x()}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload zone */}
        <UploadZone
          folder={activeFolder}
          onUploaded={() => reload(activeFolder)}
          collapsed={uploadCollapsed}
          onToggle={() => setUploadCollapsed(v => !v)}
        />

        {/* Keyboard hint */}
        <div className="flex items-center gap-4 text-[9.5px] text-white/15 flex-wrap">
          <span>Click to select · Drag to folder · <kbd>Ctrl+A</kbd> select all · <kbd>Ctrl+C/X</kbd> copy/cut · <kbd>Ctrl+V</kbd> paste</span>
        </div>

        {/* Image grid */}
        {data.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center">
              {Icon.allFiles("text-white/20 w-6 h-6")}
            </div>
            <p className="text-[13px] text-white/25">
              {search
                ? `No images matching "${search}"`
                : activeFolder
                ? `No images in "${activeFolder}" yet`
                : "No media yet — upload your first image above"}
            </p>
            {search && (
              <button
                onClick={() => { setSearchInput(""); setSearch(""); loadMedia(activeFolder, 1, ""); }}
                className="text-[11.5px] text-[#7A2267]/70 hover:text-[#7A2267] transition-colors"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <motion.div className={`grid ${GRID_COLS[gridSize]} gap-2.5`}>
            <AnimatePresence mode="popLayout">
              {data.items.map(item => (
                <MediaCard
                  key={item._id}
                  item={item}
                  selected={selected.has(item._id)}
                  inClipboard={clipIds.has(item._id)}
                  clipMode={clipboard?.mode}
                  gridSize={gridSize}
                  isDragging={dragActive && draggingIds.includes(item._id)}
                  onSelect={toggleSelect}
                  onDelete={handleDelete}
                  onAltSave={handleAltSave}
                  onDragStart={handleCardDragStart}
                  onDragEnd={handleCardDragEnd}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Pagination */}
        {data.pages > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-2 pb-16">
            <button
              onClick={() => loadMedia(activeFolder, data.page - 1)}
              disabled={data.page <= 1}
              className="w-8 h-8 rounded-lg text-[11.5px] bg-white/4 text-white/40
                hover:bg-white/8 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              ‹
            </button>
            {Array.from({ length: data.pages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => loadMedia(activeFolder, p)}
                className={`w-8 h-8 rounded-lg text-[11.5px] transition-all
                  ${p === data.page
                    ? "bg-[#7A2267] text-white font-medium"
                    : "bg-white/4 text-white/40 hover:bg-white/8 hover:text-white/70"}`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => loadMedia(activeFolder, data.page + 1)}
              disabled={data.page >= data.pages}
              className="w-8 h-8 rounded-lg text-[11.5px] bg-white/4 text-white/40
                hover:bg-white/8 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              ›
            </button>
          </div>
        )}
      </div>

      {/* ── Bulk action bar (floating, appears when selection active) ─────────── */}
      <AnimatePresence>
        {selected.size > 0 && (
          <BulkActionBar
            count={selected.size}
            folders={folders}
            moveTarget={moveTarget}
            busy={busy}
            onClear={() => setSelected(new Set())}
            onCopy={handleCopy}
            onCut={handleCut}
            onMove={handleBulkMove}
            onDelete={handleBulkDelete}
            onMoveTargetChange={setMoveTarget}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
