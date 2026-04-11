"use client";

import { useState, useEffect, useCallback } from "react";

export default function PropertyGallery({ images, propertyName }) {
  const [lightbox, setLightbox] = useState(null); // index or null

  const close = useCallback(() => setLightbox(null), []);
  const prev  = useCallback(() => setLightbox((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next  = useCallback(() => setLightbox((i) => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    if (lightbox === null) return;
    const handler = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [lightbox, close, prev, next]);

  if (!images || images.length === 0) return null;

  // Layout: first image hero, then 2-col grid
  const hero    = images[0];
  const rest    = images.slice(1);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[17px] font-bold text-neutral-800">Gallery</h2>
        <span className="text-[11px] text-neutral-400">{images.length} photos</span>
      </div>

      {/* Creative grid */}
      <div className="grid grid-cols-3 grid-rows-2 gap-2 h-[320px] sm:h-[380px] rounded-2xl overflow-hidden">
        {/* Hero — left 2 cols, full height */}
        <button
          onClick={() => setLightbox(0)}
          className="col-span-2 row-span-2 relative group overflow-hidden focus:outline-none"
        >
          <img
            src={hero}
            alt={`${propertyName} 1`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300
              bg-white/90 text-neutral-800 text-[11px] font-semibold px-3 py-1.5 rounded-full">
              View
            </span>
          </div>
        </button>

        {/* Side thumbnails — right col, 2 rows */}
        {rest.slice(0, 2).map((src, idx) => (
          <button
            key={idx}
            onClick={() => setLightbox(idx + 1)}
            className="relative group overflow-hidden focus:outline-none"
          >
            <img
              src={src}
              alt={`${propertyName} ${idx + 2}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* "See all" overlay on last visible thumb */}
            {idx === 1 && images.length > 3 && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                <span className="text-white text-[18px] font-bold">+{images.length - 3}</span>
                <span className="text-white/80 text-[10px] mt-0.5">more</span>
              </div>
            )}
            {!(idx === 1 && images.length > 3) && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            )}
          </button>
        ))}
      </div>

      {/* View all strip */}
      {images.length > 1 && (
        <button
          onClick={() => setLightbox(0)}
          className="mt-3 w-full py-2.5 border border-neutral-200 rounded-xl text-[12px] text-neutral-600
            font-medium hover:border-[#7A2267]/40 hover:text-[#7A2267] transition-all duration-200"
        >
          View all {images.length} photos
        </button>
      )}

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={close}
        >
          {/* Close */}
          <button
            onClick={close}
            className="absolute top-4 right-4 z-10 text-white/70 hover:text-white transition-colors
              w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
          >
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-[12px]">
            {lightbox + 1} / {images.length}
          </div>

          {/* Prev */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-4 z-10 text-white/70 hover:text-white transition-colors
                w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
            >
              <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          {/* Image */}
          <div
            className="max-w-5xl max-h-[90vh] px-16"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[lightbox]}
              alt={`${propertyName} ${lightbox + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
          </div>

          {/* Next */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-4 z-10 text-white/70 hover:text-white transition-colors
                w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
            >
              <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] px-4">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setLightbox(i); }}
                  className={`shrink-0 w-14 h-10 rounded-lg overflow-hidden transition-all duration-200
                    ${i === lightbox ? "ring-2 ring-white opacity-100" : "opacity-40 hover:opacity-70"}`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
