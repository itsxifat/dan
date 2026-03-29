// ── Content categories — visitor-facing filter tabs ───────────────────────────
export const GALLERY_CATEGORY_SUGGESTIONS = [
  "Swimming Pool",
  "Rooms",
  "Dining",
  "Nature",
  "Events",
  "Amenities",
  "General",
];

// ── Image sizes — drives auto-layout in category filter view ──────────────────
// Desktop: 4-col grid, gridAutoRows: 200px
export const IMAGE_SIZES = {
  square: {
    label: "Square",
    ratio: "1:1",
    recommendedPx: "800 × 800 px",
    colSpan: 1,
    rowSpan: 1,
    hint: "Standard square. Fills one cell in the category grid.",
  },
  landscape: {
    label: "Landscape",
    ratio: "2:1",
    recommendedPx: "1200 × 600 px",
    colSpan: 2,
    rowSpan: 1,
    hint: "Wide horizontal. Spans 2 columns in the category grid. Same ratio as the Homepage Wide slot.",
  },
  portrait: {
    label: "Portrait",
    ratio: "3:4",
    recommendedPx: "600 × 800 px",
    colSpan: 1,
    rowSpan: 2,
    hint: "Tall vertical. Spans 2 rows in the category grid.",
  },
  wide: {
    label: "Wide",
    ratio: "16:5",
    recommendedPx: "1600 × 500 px",
    colSpan: 4,
    rowSpan: 1,
    hint: "Full-width banner. Spans all 4 columns in the category grid. Same ratio as the Homepage Banner slot.",
  },
};

// ── Homepage grid placement slots ─────────────────────────────────────────────
// These determine position in the 5-col × 3-row hierarchical grid (desktop homepage).
// Photos with placement "none" are category-only — never in the homepage grid.
export const PLACEMENT_SLOTS = {
  none: {
    label: "None",
    ratio: "—",
    recommendedPx: "—",
    maxCount: Infinity,
    gridDesc: "Category view only · Not shown in homepage grid",
    hint: "This photo will only appear when a visitor filters by its content category.",
  },
  hero: {
    label: "Hero",
    ratio: "1:1",
    recommendedPx: "1000 × 1000 px",
    maxCount: 1,
    gridDesc: "Slot 1 · Top-left · 2 cols × 2 rows",
    hint: "Square image. Dominates the top-left of the homepage grid.",
  },
  banner: {
    label: "Banner",
    ratio: "16:5",
    recommendedPx: "1600 × 500 px",
    maxCount: 1,
    gridDesc: "Slot 2 · Top-right · 3 cols × 1 row",
    hint: "Ultra-wide landscape. Spans across 3 columns at the top-right.",
  },
  wide: {
    label: "Wide",
    ratio: "2:1",
    recommendedPx: "1200 × 600 px",
    maxCount: 1,
    gridDesc: "Slot 3 · Mid-right · 2 cols × 1 row",
    hint: "Wide landscape. Sits below the banner in the middle-right area.",
  },
  square: {
    label: "Square",
    ratio: "1:1",
    recommendedPx: "800 × 800 px",
    maxCount: 6,
    gridDesc: "Slots 4–9 · Bottom row + far-right · 1 col × 1 row each",
    hint: "Square images. Fill the remaining 6 cells of the homepage grid.",
  },
};

// Sort order for homepage grid placement
export const PLACEMENT_ORDER = { hero: 0, banner: 1, wide: 2, square: 3 };

// Total max photos the homepage grid can show
export const GRID_MAX = 9;
