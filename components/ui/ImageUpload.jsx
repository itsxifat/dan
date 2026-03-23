"use client";

import { useState, useRef, useCallback, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Lazy-load MediaPicker so it only loads in admin context
const MediaPicker = lazy(() => import("@/components/admin/MediaPicker"));

/**
 * ImageUpload – uploads to /api/upload (saves to public/uploads/).
 * Props:
 *   value     – current image URL string
 *   onChange  – called with new URL string
 *   className – extra wrapper classes
 *   dark      – dark theme (admin panel); also enables "Pick from library" button
 */
export default function ImageUpload({ value, onChange, className = "", dark = false }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState("");
  const [dragging, setDragging]   = useState(false);
  const [pickerOpen, setPicker]   = useState(false);
  const inputRef = useRef(null);

  const upload = useCallback(async (file) => {
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      onChange(data.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  function handleInputChange(e) {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  }

  const border  = dark ? "border-white/[0.08] hover:border-[#7A2267]/50" : "border-neutral-200 hover:border-[#7A2267]/50";
  const bg      = dark ? "bg-white/[0.03]" : "bg-neutral-50";
  const textClr = dark ? "text-white/35"   : "text-neutral-400";
  const sub     = dark ? "text-white/20"   : "text-neutral-300";

  return (
    <div className={className}>
      {/* Preview */}
      <AnimatePresence mode="wait">
        {value && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="relative mb-2 rounded-xl overflow-hidden border border-white/8 group"
            style={{ height: 120 }}
          >
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors duration-200" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white
                text-[13px] leading-none flex items-center justify-center
                opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-500"
            >
              ×
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="absolute bottom-2 left-2 text-[10.5px] text-white bg-black/50 px-2.5 py-1
                rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              Replace
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drop zone */}
      <motion.div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        animate={{ scale: dragging ? 1.015 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed px-4 py-5 text-center
          transition-colors duration-200 select-none
          ${border} ${bg} ${dragging ? "border-[#7A2267]/60 bg-[#7A2267]/5" : ""}`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 rounded-full border-2 border-[#7A2267]/30 border-t-[#7A2267]"
            />
            <p className={`text-[12px] ${textClr}`}>Uploading…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <svg viewBox="0 0 20 20" width="20" height="20" fill="none" className={textClr}>
              <path d="M10 3v10M6 7l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 14v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p className={`text-[12.5px] font-medium ${textClr}`}>
              {dragging ? "Drop to upload" : "Click or drag image here"}
            </p>
            <p className={`text-[10.5px] ${sub}`}>PNG, JPG, WebP · max 10 MB</p>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleInputChange} />
      </motion.div>

      {/* Admin: pick from library */}
      {dark && (
        <button
          type="button"
          onClick={() => setPicker(true)}
          className="mt-2 text-[10.5px] text-white/30 hover:text-white/60 flex items-center gap-1.5 transition-colors duration-200"
        >
          <svg viewBox="0 0 14 14" width="11" height="11" fill="none" className="shrink-0">
            <rect x="0.7" y="2.5" width="12.6" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="4.5" cy="5.5" r="1" stroke="currentColor" strokeWidth="1.1" />
            <path d="M0.7 10l3.5-3 2.5 2 2-1.5 3.5 2.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Pick from library
        </button>
      )}

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-1.5 text-[11.5px] text-red-400"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Media picker modal */}
      {dark && pickerOpen && (
        <Suspense fallback={null}>
          <MediaPicker
            open={pickerOpen}
            onClose={() => setPicker(false)}
            onSelect={(url) => { onChange(url); setPicker(false); }}
          />
        </Suspense>
      )}
    </div>
  );
}
