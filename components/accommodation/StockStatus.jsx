import { Josefin_Sans } from "next/font/google";

const josefin = Josefin_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });

/**
 * Stock/availability indicators shown on every bookable listing.
 *
 * Payment-gateway compliance requires stock to be stated on the listing itself,
 * and out-of-stock items to carry the status on the image as well — hence the
 * two variants: an inline text line and an overlay badge.
 */

// Inline "In Stock — 4 of 12 rooms available" / "Out of Stock" line.
export function StockLine({ available, total, unit = "rooms", className = "" }) {
  const inStock = available > 0;
  const known   = total > 0;

  return (
    <span className={`${josefin.className} inline-flex items-center gap-1.5 text-[11.5px] ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${inStock ? "bg-emerald-500" : "bg-red-500"}`} />
      <span className={`font-semibold ${inStock ? "text-emerald-700" : "text-red-600"}`}>
        {inStock ? "In Stock" : "Out of Stock"}
      </span>
      {known && (
        <span className="text-[#9b8e78] font-light">
          {inStock ? `— ${available} of ${total} ${unit} available` : `— 0 of ${total} ${unit} available`}
        </span>
      )}
    </span>
  );
}

// Badge overlaid on the cover image. Rendered for out-of-stock items always;
// pass showWhenInStock to label available ones too.
export function StockBadge({ available, showWhenInStock = false, className = "" }) {
  const inStock = available > 0;
  if (inStock && !showWhenInStock) return null;

  return (
    <span className={`${josefin.className} text-[8.5px] uppercase tracking-[0.18em] font-semibold
      px-2.5 py-1 rounded-full backdrop-blur-sm border
      ${inStock
        ? "bg-emerald-900/70 text-emerald-200 border-emerald-500/40"
        : "bg-red-900/75 text-red-100 border-red-400/40"
      } ${className}`}>
      {inStock ? "Available" : "Out of Stock"}
    </span>
  );
}
