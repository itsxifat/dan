"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7A2267] text-white
        text-[12.5px] font-semibold hover:bg-[#8e2878] transition-colors duration-200"
    >
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
        <rect x="3" y="1" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.3" />
        <path d="M3 6H1a1 1 0 00-1 1v5a1 1 0 001 1h2v-3h10v3h2a1 1 0 001-1V7a1 1 0 00-1-1h-2" stroke="currentColor" strokeWidth="1.3" />
        <rect x="3" y="10" width="10" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      </svg>
      Print Invoice
    </button>
  );
}
