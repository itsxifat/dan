"use client";

import { useState, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MediaPicker = lazy(() => import("@/components/admin/MediaPicker"));

/**
 * MultiImageUpload — choose multiple images from Media Library (no direct device upload).
 * Upload first via Admin → Media, then pick here.
 *
 * Props:
 *   values   – string[] of current URLs
 *   onChange – called with new string[]
 *   dark     – kept for backward compat, no longer changes behaviour
 */
export default function MultiImageUpload({ values = [], onChange, dark = false }) {
  const [pickerOpen, setPicker] = useState(false);

  function remove(i) {
    onChange(values.filter((_, idx) => idx !== i));
  }

  function handleLibrarySelect(urls) {
    const fresh = urls.filter((u) => !values.includes(u));
    onChange([...values, ...fresh]);
  }

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

      {/* Choose from library button */}
      <motion.button
        type="button"
        onClick={() => setPicker(true)}
        whileHover={{ scale: 1.012 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="w-full rounded-xl border-2 border-dashed px-4 py-4 text-center
          transition-colors duration-200 select-none cursor-pointer
          border-white/10 hover:border-[#7A2267]/50 bg-white/3"
      >
        <div className="flex items-center justify-center gap-2">
          <svg viewBox="0 0 16 16" width="15" height="15" fill="none" className="text-white/30 shrink-0">
            <rect x="0.7" y="2.5" width="14.6" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            <circle cx="4.5" cy="6.5" r="1.2" stroke="currentColor" strokeWidth="1.1" />
            <path d="M0.7 11.5l4-3.5 3 2.5 2.5-2 4 3" stroke="currentColor" strokeWidth="1.2"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-[12px] font-medium text-white/35">
            {values.length > 0 ? "Add more from Media Library" : "Choose from Media Library"}
          </p>
        </div>
      </motion.button>

      {/* Media picker modal */}
      {pickerOpen && (
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
