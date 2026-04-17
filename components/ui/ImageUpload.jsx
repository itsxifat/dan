"use client";

import { useState, useRef, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MediaPicker = lazy(() => import("@/components/admin/MediaPicker"));

/**
 * ImageUpload — upload directly from device OR pick from Media Library.
 *
 * Props:
 *   value     – current image URL string
 *   onChange  – called with new URL string
 *   className – extra wrapper classes
 *   dark      – kept for backward compat
 */
export default function ImageUpload({ value, onChange, className = "", dark = false }) {
  const [pickerOpen, setPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/avif"];
    if (!ALLOWED.includes(file.type)) {
      setError("Only image files are allowed (JPEG, PNG, WebP, GIF, AVIF).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum size is 10 MB.");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "general");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onChange(data.url);
    } catch (err) {
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

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
              onClick={() => setPicker(true)}
              className="absolute bottom-2 left-2 text-[10.5px] text-white bg-black/50 px-2.5 py-1
                rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              Replace
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload / pick area */}
      {!value && (
        <div className="space-y-2">
          {/* Direct upload drop zone */}
          <motion.div
            onClick={() => !uploading && inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = Array.from(e.dataTransfer.files || []).find((f) => f.type.startsWith("image/"));
              if (file) handleFile(file);
            }}
            whileHover={uploading ? {} : { scale: 1.008 }}
            whileTap={uploading ? {} : { scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="w-full rounded-xl border-2 border-dashed px-4 py-5 text-center
              transition-colors duration-200 select-none cursor-pointer
              border-white/10 hover:border-[#7A2267]/50 bg-white/[0.03]"
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 rounded-full border-2 border-white/10 border-t-[#7A2267]"
                />
                <p className="text-[11.5px] text-white/35">Uploading…</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <svg viewBox="0 0 20 20" width="22" height="22" fill="none" className="text-white/25">
                  <path d="M10 3v10M7 6l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 15v1a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <p className="text-[12.5px] font-medium text-white/35">Click or drag to upload</p>
                <p className="text-[10px] text-white/18">JPEG, PNG, WebP · max 10 MB</p>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) handleFile(file);
              }}
            />
          </motion.div>

          {/* Library picker link */}
          <button
            type="button"
            onClick={() => setPicker(true)}
            className="w-full py-2 rounded-xl border border-white/[0.06] text-[11px] text-white/30
              hover:text-white/60 hover:border-white/12 transition-colors duration-200"
          >
            Or choose from Media Library
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mt-1.5 text-[10.5px] text-red-400/80">{error}</p>
      )}

      {/* Media picker modal */}
      {pickerOpen && (
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
