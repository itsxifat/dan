"use client";

import { useState, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MediaPicker = lazy(() => import("@/components/admin/MediaPicker"));

/**
 * ImageUpload — choose image from Media Library (no direct device upload).
 * Upload first via Admin → Media, then pick here.
 *
 * Props:
 *   value     – current image URL string
 *   onChange  – called with new URL string
 *   className – extra wrapper classes
 *   dark      – kept for backward compat, no longer changes behaviour
 */
export default function ImageUpload({ value, onChange, className = "", dark = false }) {
  const [pickerOpen, setPicker] = useState(false);

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

      {/* Choose from library button */}
      {!value && (
        <motion.button
          type="button"
          onClick={() => setPicker(true)}
          whileHover={{ scale: 1.012 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="w-full rounded-xl border-2 border-dashed px-4 py-5 text-center
            transition-colors duration-200 select-none cursor-pointer
            border-white/10 hover:border-[#7A2267]/50 bg-white/[0.03]"
        >
          <div className="flex flex-col items-center gap-2">
            <svg viewBox="0 0 20 20" width="22" height="22" fill="none" className="text-white/25">
              <rect x="1" y="3" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" />
              <circle cx="6.5" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M1 14l4.5-4 3 2.5 3-2.5 5.5 4" stroke="currentColor" strokeWidth="1.3"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-[12.5px] font-medium text-white/35">Choose from Media Library</p>
            <p className="text-[10.5px] text-white/18">
              Upload images via Admin → Media, then pick here
            </p>
          </div>
        </motion.button>
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
