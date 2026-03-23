"use client";

import { useState, useRef, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MediaPicker = lazy(() => import("@/components/admin/MediaPicker"));

/**
 * MultiImageUpload – upload multiple images, stored as URL array.
 * Props:
 *   values   – string[] of current URLs
 *   onChange – called with new string[]
 *   dark     – dark theme (admin panel); also enables "Pick from library" button
 */
export default function MultiImageUpload({ values = [], onChange, dark = false }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState("");
  const [dragging, setDragging]   = useState(false);
  const [pickerOpen, setPicker]   = useState(false);
  const inputRef = useRef(null);

  async function uploadFile(file) {
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      onChange([...values, data.url]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function handleInput(e) {
    const files = Array.from(e.target.files || []);
    files.forEach(uploadFile);
    e.target.value = "";
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    files.forEach(uploadFile);
  }

  function remove(i) {
    onChange(values.filter((_, idx) => idx !== i));
  }

  function handleLibrarySelect(urls) {
    // Filter out duplicates
    const fresh = urls.filter((u) => !values.includes(u));
    onChange([...values, ...fresh]);
  }

  const border  = dark ? "border-white/10 hover:border-[#7A2267]/50" : "border-neutral-200 hover:border-[#7A2267]/50";
  const bg      = dark ? "bg-white/[0.03]" : "bg-neutral-50";
  const textClr = dark ? "text-white/35"   : "text-neutral-400";
  const sub     = dark ? "text-white/20"   : "text-neutral-300";

  return (
    <div className="space-y-3">
      {/* Thumbnail grid */}
      <AnimatePresence>
        {values.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="grid grid-cols-3 sm:grid-cols-4 gap-2"
          >
            {values.map((url, i) => (
              <motion.div
                key={url + i}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                className="relative group aspect-square rounded-xl overflow-hidden border border-white/10"
              >
                <img src={url} alt={`gallery-${i}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200" />
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 text-white
                    text-[11px] leading-none flex items-center justify-center
                    opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-500"
                >
                  ×
                </button>
              </motion.div>
            ))}
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
        className={`relative cursor-pointer rounded-xl border-2 border-dashed px-4 py-4 text-center
          transition-colors duration-200 select-none
          ${border} ${bg} ${dragging ? "border-[#7A2267]/60 bg-[#7A2267]/5" : ""}`}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 rounded-full border-2 border-[#7A2267]/30 border-t-[#7A2267]"
            />
            <p className={`text-[11.5px] ${textClr}`}>Uploading…</p>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <svg viewBox="0 0 16 16" width="15" height="15" fill="none" className={textClr}>
              <path d="M8 2v8M5 5l3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <p className={`text-[12px] font-medium ${textClr}`}>
              {dragging ? "Drop images here" : "Add images"}
            </p>
            <p className={`text-[10.5px] ${sub}`}>PNG, JPG, WebP</p>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleInput} />
      </motion.div>

      {/* Admin: pick from library */}
      {dark && (
        <button
          type="button"
          onClick={() => setPicker(true)}
          className="text-[10.5px] text-white/30 hover:text-white/60 flex items-center gap-1.5 transition-colors duration-200"
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
            className="text-[11.5px] text-red-400"
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
            multiple
            onSelectMultiple={handleLibrarySelect}
          />
        </Suspense>
      )}
    </div>
  );
}
