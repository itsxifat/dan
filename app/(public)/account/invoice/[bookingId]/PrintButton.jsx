"use client";

import { useState } from "react";

export default function PrintButton() {
  const [printing, setPrinting] = useState(false);

  function handlePrint() {
    setPrinting(true);
    // Give React a tick to update state before triggering print dialog
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 120);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <button
        onClick={handlePrint}
        disabled={printing}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          padding: "9px 20px",
          borderRadius: "10px",
          background: "#7A2267",
          color: "#fff",
          fontSize: "12.5px",
          fontWeight: "600",
          border: "none",
          cursor: printing ? "not-allowed" : "pointer",
          opacity: printing ? 0.7 : 1,
          transition: "background 0.2s",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => { if (!printing) e.currentTarget.style.background = "#8e2878"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "#7A2267"; }}
      >
        {printing ? (
          <>
            <svg
              viewBox="0 0 14 14"
              width="13"
              height="13"
              fill="none"
              style={{ animation: "spin 1s linear infinite" }}
            >
              <circle cx="7" cy="7" r="5.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
              <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Opening…
          </>
        ) : (
          <>
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
              <rect x="3" y="1" width="10" height="6" rx="1" stroke="currentColor" strokeWidth="1.3" />
              <path
                d="M3 5.5H1a1 1 0 00-1 1v5a1 1 0 001 1h2v-3h10v3h2a1 1 0 001-1v-5a1 1 0 00-1-1h-2"
                stroke="currentColor"
                strokeWidth="1.3"
              />
              <rect x="3" y="10" width="10" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
            </svg>
            Download PDF
          </>
        )}
      </button>

      {/* Tip */}
      <span
        style={{
          fontSize: "10.5px",
          color: "#B8A5C8",
          maxWidth: "200px",
          lineHeight: "1.4",
        }}
      >
        In the print dialog, choose{" "}
        <strong style={{ color: "#9B8BAB" }}>Save as PDF</strong>
      </span>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
