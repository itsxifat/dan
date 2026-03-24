"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

// ─── helpers ──────────────────────────────────────────────────────────────────

function ytEmbed(url) {
  return url
    .replace(/watch\?v=/, "embed/")
    .replace(/youtu\.be\//, "www.youtube.com/embed/")
    .replace(/vimeo\.com\/(\d+)/, "player.vimeo.com/video/$1");
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({ items, startIndex, onClose }) {
  const [idx,    setIdx]    = useState(startIndex);
  const [zoom,   setZoom]   = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const dragStart  = useRef(null);
  const imgRef     = useRef(null);
  const touchDist  = useRef(null); // for pinch
  const lastOffset = useRef({ x: 0, y: 0 });

  const current = items[idx];
  const isVideo = current?.type === "video";
  const total   = items.length;

  // Reset zoom when slide changes
  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    lastOffset.current = { x: 0, y: 0 };
  }, [idx]);

  // Keyboard navigation
  useEffect(() => {
    function handler(e) {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "+")          zoomIn();
      if (e.key === "-")          zoomOut();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }); // intentionally no deps — captures latest closures

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  function next() { setIdx((i) => (i + 1) % total); }
  function prev() { setIdx((i) => (i - 1 + total) % total); }

  function zoomIn()  { setZoom((z) => clamp(z + 0.5, 1, 5)); }
  function zoomOut() {
    setZoom((z) => {
      const nz = clamp(z - 0.5, 1, 5);
      if (nz === 1) setOffset({ x: 0, y: 0 });
      return nz;
    });
  }
  function resetZoom() { setZoom(1); setOffset({ x: 0, y: 0 }); }

  // Mouse wheel zoom
  function handleWheel(e) {
    if (isVideo) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.3 : -0.3;
    setZoom((z) => {
      const nz = clamp(z + delta, 1, 5);
      if (nz === 1) setOffset({ x: 0, y: 0 });
      return nz;
    });
  }

  // Mouse drag (pan when zoomed)
  function handleMouseDown(e) {
    if (zoom <= 1) return;
    setDragging(true);
    dragStart.current = { x: e.clientX - lastOffset.current.x, y: e.clientY - lastOffset.current.y };
  }
  function handleMouseMove(e) {
    if (!dragging || !dragStart.current) return;
    const nx = e.clientX - dragStart.current.x;
    const ny = e.clientY - dragStart.current.y;
    setOffset({ x: nx, y: ny });
    lastOffset.current = { x: nx, y: ny };
  }
  function handleMouseUp() { setDragging(false); }

  // Touch: pinch-to-zoom + swipe
  const swipeStart = useRef(null);
  function handleTouchStart(e) {
    if (e.touches.length === 2) {
      // pinch start
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchDist.current = Math.hypot(dx, dy);
    } else if (e.touches.length === 1 && zoom <= 1) {
      swipeStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 1 && zoom > 1) {
      dragStart.current = {
        x: e.touches[0].clientX - lastOffset.current.x,
        y: e.touches[0].clientY - lastOffset.current.y,
      };
      setDragging(true);
    }
  }
  function handleTouchMove(e) {
    if (e.touches.length === 2 && touchDist.current != null) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const scale = dist / touchDist.current;
      touchDist.current = dist;
      setZoom((z) => {
        const nz = clamp(z * scale, 1, 5);
        if (nz === 1) setOffset({ x: 0, y: 0 });
        return nz;
      });
    } else if (e.touches.length === 1 && dragging) {
      const nx = e.touches[0].clientX - dragStart.current.x;
      const ny = e.touches[0].clientY - dragStart.current.y;
      setOffset({ x: nx, y: ny });
      lastOffset.current = { x: nx, y: ny };
    }
  }
  function handleTouchEnd(e) {
    touchDist.current = null;
    if (dragging) { setDragging(false); return; }
    if (!swipeStart.current) return;
    const dx = e.changedTouches[0].clientX - swipeStart.current.x;
    if (Math.abs(dx) > 50) {
      dx < 0 ? next() : prev();
    }
    swipeStart.current = null;
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="lightbox"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex flex-col bg-black/97 select-none"
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "default" }}
      >
        {/* ── Top bar ── */}
        <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 bg-gradient-to-b from-black/60 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-white/60 text-[12px] font-mono">
              {idx + 1} / {total}
            </span>
            {current.caption && (
              <span className="text-white/50 text-[12px] hidden sm:block truncate max-w-xs">{current.caption}</span>
            )}
          </div>

          {/* Zoom controls — only for images */}
          {!isVideo && (
            <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1">
              <button onClick={zoomOut} disabled={zoom <= 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:bg-white/15 disabled:opacity-30 transition-colors"
                title="Zoom out (-)">
                <svg viewBox="0 0 14 14" width="13" height="13" fill="none">
                  <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M4 6h4M10 10l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </button>
              <button onClick={resetZoom}
                className="px-2 h-8 text-[11px] text-white/60 hover:text-white font-mono transition-colors min-w-[3rem] text-center"
                title="Reset zoom">
                {Math.round(zoom * 100)}%
              </button>
              <button onClick={zoomIn} disabled={zoom >= 5}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:bg-white/15 disabled:opacity-30 transition-colors"
                title="Zoom in (+)">
                <svg viewBox="0 0 14 14" width="13" height="13" fill="none">
                  <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M4 6h4M6 4v4M10 10l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            title="Close (Esc)"
          >
            <svg viewBox="0 0 14 14" width="14" height="14" fill="none">
              <path d="M2 2l10 10M12 2 2 12" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* ── Main image / video area ── */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden">
          {/* Prev button */}
          {total > 1 && (
            <button
              onClick={prev}
              className="absolute left-2 sm:left-4 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-all duration-150 backdrop-blur-sm"
              title="Previous (←)"
            >
              <svg viewBox="0 0 10 16" width="9" height="14" fill="none">
                <path d="M8 2 2 8l6 6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              className="relative w-full h-full flex items-center justify-center px-14 sm:px-20"
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {isVideo ? (
                <div className="w-full max-w-5xl aspect-video rounded-xl overflow-hidden bg-black shadow-2xl">
                  <iframe
                    src={ytEmbed(current.src)}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={current.caption || `Video ${idx + 1}`}
                  />
                </div>
              ) : (
                <img
                  ref={imgRef}
                  src={current.src}
                  alt={current.caption || `Photo ${idx + 1}`}
                  draggable={false}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-transform duration-150"
                  style={{
                    transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
                    transformOrigin: "center",
                    maxHeight: "calc(100vh - 160px)",
                    userSelect: "none",
                    WebkitUserDrag: "none",
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Next button */}
          {total > 1 && (
            <button
              onClick={next}
              className="absolute right-2 sm:right-4 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-all duration-150 backdrop-blur-sm"
              title="Next (→)"
            >
              <svg viewBox="0 0 10 16" width="9" height="14" fill="none">
                <path d="M2 2 8 8l-6 6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>

        {/* ── Thumbnail strip ── */}
        {total > 1 && (
          <div className="shrink-0 py-3 px-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 justify-center scrollbar-thin">
              {items.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`relative shrink-0 w-14 h-10 sm:w-16 sm:h-11 rounded-lg overflow-hidden transition-all duration-150
                    ${i === idx ? "ring-2 ring-[#7A2267] opacity-100 scale-105" : "opacity-40 hover:opacity-70"}`}
                >
                  {item.type === "video" ? (
                    <div className="w-full h-full bg-[#1C1C1C] flex items-center justify-center">
                      <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
                        <circle cx="8" cy="8" r="7" stroke="white" strokeWidth="1.2" opacity=".6"/>
                        <path d="M6 5.5l5 2.5-5 2.5V5.5z" fill="white" opacity=".6"/>
                      </svg>
                    </div>
                  ) : (
                    <img src={item.src} alt="" className="w-full h-full object-cover" draggable={false} />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Keyboard hint */}
        <p className="text-center text-[10px] text-white/20 pb-2 sm:pb-3 shrink-0 hidden sm:block">
          {!isVideo && "Scroll to zoom · Drag to pan · "}← → navigate · Esc close
        </p>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

// ─── Public Gallery Component ─────────────────────────────────────────────────

export default function RoomGallery({ coverImage, images, videos, roomNumber }) {
  const [lightboxIdx, setLightboxIdx] = useState(null);

  // Build combined media list: cover + gallery images + videos
  const items = [
    ...(coverImage ? [{ type: "image", src: coverImage, caption: `Room ${roomNumber} — Cover` }] : []),
    ...(images ?? []).map((src, i) => ({ type: "image", src, caption: `Room ${roomNumber} — Photo ${i + 1}` })),
    ...(videos ?? []).map((src, i) => ({ type: "video", src, caption: `Room ${roomNumber} — Video ${i + 1}` })),
  ];

  // Offset indices: cover is index 0, gallery starts at 1
  const coverIdx   = coverImage ? 0 : -1;
  const galleryOff = coverImage ? 1 : 0;
  const videoOff   = galleryOff + (images?.length ?? 0);

  const hasGallery = (images?.length ?? 0) > 0;
  const hasVideos  = (videos?.length ?? 0) > 0;

  if (!hasGallery && !hasVideos) return null;

  return (
    <>
      {/* ── Gallery grid ── */}
      {hasGallery && (
        <div className="bg-white border border-[#EDE5F0] rounded-2xl p-6">
          <p className="text-[9.5px] uppercase tracking-[0.18em] text-[#9B8BAB] font-semibold mb-4">Gallery</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setLightboxIdx(galleryOff + i)}
                className="group relative aspect-video rounded-xl overflow-hidden bg-[#F7F4F0] cursor-zoom-in"
                title="Click to enlarge"
              >
                <img
                  src={img}
                  alt={`Room ${roomNumber} — Photo ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Zoom overlay hint */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/0 group-hover:bg-white/90 flex items-center justify-center transition-all duration-200 scale-75 group-hover:scale-100 shadow-lg">
                    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" className="text-[#7A2267]">
                      <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.4"/>
                      <path d="M4.5 6.5h4M6.5 4.5v4M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
                {/* Photo number badge */}
                <div className="absolute bottom-1.5 right-1.5 bg-black/50 backdrop-blur-sm text-white text-[9px] font-mono px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                  {i + 1}/{images.length}
                </div>
              </button>
            ))}
          </div>
          <p className="text-[10.5px] text-[#C4B3CE] mt-3 text-center">
            Tap any photo to view full size · Scroll or pinch to zoom
          </p>
        </div>
      )}

      {/* ── Videos ── */}
      {hasVideos && (
        <div className="bg-white border border-[#EDE5F0] rounded-2xl p-6">
          <p className="text-[9.5px] uppercase tracking-[0.18em] text-[#9B8BAB] font-semibold mb-4">Video Tour</p>
          <div className="space-y-4">
            {videos.map((url, i) => (
              <div key={i} className="relative">
                {/* Thumbnail with play button that opens lightbox */}
                <button
                  type="button"
                  onClick={() => setLightboxIdx(videoOff + i)}
                  className="group relative w-full aspect-video rounded-xl overflow-hidden bg-[#1C1C1C] block cursor-pointer"
                >
                  {/* Embedded iframe (non-interactive, visual only) */}
                  <iframe
                    src={`${ytEmbed(url)}?controls=0&modestbranding=1`}
                    className="w-full h-full pointer-events-none"
                    title={`Room video ${i + 1}`}
                    tabIndex={-1}
                  />
                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors duration-200">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#7A2267]/90 group-hover:bg-[#7A2267] group-hover:scale-110 flex items-center justify-center transition-all duration-200 shadow-xl">
                      <svg viewBox="0 0 20 20" width="20" height="20" fill="none">
                        <path d="M7 5l9 5-9 5V5z" fill="white"/>
                      </svg>
                    </div>
                  </div>
                  <p className="absolute bottom-3 left-3 text-white/80 text-[11px] font-semibold bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg">
                    Watch Full Video
                  </p>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightboxIdx !== null && (
        <Lightbox
          items={items}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </>
  );
}
