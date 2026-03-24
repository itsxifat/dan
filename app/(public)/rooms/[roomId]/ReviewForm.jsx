"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { submitReview } from "@/actions/accommodation/reviewActions";
import { useRouter } from "next/navigation";

function StarPicker({ rating, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform duration-100 hover:scale-110"
        >
          <svg viewBox="0 0 20 20" width="28" height="28" fill="none">
            <path
              d="M10 2l2.4 5h5.1l-4.1 3.1 1.6 5L10 12.1 5 15.1l1.6-5L2.5 7h5.1L10 2z"
              fill={s <= (hovered || rating) ? "#7A2267" : "#EDE5F0"}
              stroke={s <= (hovered || rating) ? "#7A2267" : "#D8CAE0"}
              strokeWidth="0.8"
            />
          </svg>
        </button>
      ))}
      {rating > 0 && (
        <span className="ml-2 text-[12px] text-[#7A2267] font-semibold">
          {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
        </span>
      )}
    </div>
  );
}

const FI = "w-full bg-[#FEFCF9] border border-[#E4DAE8] rounded-xl px-4 py-3 text-[13.5px] text-[#1C1C1C] placeholder-[#C4B3CE] focus:outline-none focus:border-[#7A2267]/50 focus:ring-2 focus:ring-[#7A2267]/8 transition-all duration-200";
const FL = "block text-[9.5px] uppercase tracking-[0.14em] text-[#9B8BAB] font-semibold mb-1.5";

export default function ReviewForm({ roomId, bookingId }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!rating) { setError("Please select a star rating."); return; }

    startTransition(async () => {
      try {
        await submitReview({
          roomId,
          bookingId,
          rating,
          title,
          body,
          userId: session?.user?.id,
        });
        setSuccess(true);
        router.refresh();
      } catch (err) {
        setError(err.message || "Failed to submit review.");
      }
    });
  }

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 text-center">
        <p className="text-[14px] font-semibold text-emerald-800">Thank you for your review!</p>
        <p className="text-[12px] text-emerald-600 mt-1">Your feedback helps other guests make informed decisions.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-[#EDE5F0] pt-5 space-y-4">
      <p className="text-[13px] font-semibold text-[#1C1C1C]">Write Your Review</p>

      {error && (
        <p className="text-[12px] text-[#7A2267] bg-[#7A2267]/5 border border-[#7A2267]/15 px-4 py-2.5 rounded-xl">
          {error}
        </p>
      )}

      <div>
        <label className={FL}>Your Rating *</label>
        <StarPicker rating={rating} onChange={setRating} />
      </div>

      <div>
        <label className={FL}>Review Title</label>
        <input className={FI} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Summarise your experience" />
      </div>

      <div>
        <label className={FL}>Your Review</label>
        <textarea className={`${FI} resize-none`} rows={4} value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share details about your stay — cleanliness, comfort, service…" />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="px-6 py-3 rounded-xl bg-[#7A2267] text-white text-[13px] font-semibold
          hover:bg-[#8e2878] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      >
        {isPending ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  );
}
