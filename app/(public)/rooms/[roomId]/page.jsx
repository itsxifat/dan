import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Cormorant_Garamond } from "next/font/google";
import { getRoomProfile } from "@/actions/accommodation/roomProfileActions";
import { getReviewsForRoom, canUserReview } from "@/actions/accommodation/reviewActions";
import ReviewForm from "./ReviewForm";
import RoomGallery from "./RoomGallery";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

export const dynamic = "force-dynamic";

function StarRating({ rating, size = 16 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} viewBox="0 0 20 20" width={size} height={size} fill="none">
          <path
            d="M10 2l2.4 5h5.1l-4.1 3.1 1.6 5L10 12.1 5 15.1l1.6-5L2.5 7h5.1L10 2z"
            fill={s <= Math.round(rating) ? "#7A2267" : "#EDE5F0"}
            stroke={s <= Math.round(rating) ? "#7A2267" : "#D8CAE0"}
            strokeWidth="0.8"
          />
        </svg>
      ))}
    </div>
  );
}

function ReviewCard({ review }) {
  const date = new Date(review.createdAt).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
  return (
    <div className="bg-white border border-[#EDE5F0] rounded-2xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {review.user?.image ? (
            <img src={review.user.image} alt={review.user.name} className="w-9 h-9 rounded-full object-cover border border-[#EDE5F0]" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#7A2267]/10 flex items-center justify-center border border-[#7A2267]/20">
              <span className="text-[14px] font-semibold text-[#7A2267]">
                {(review.user?.name || "?")[0].toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="text-[13px] font-semibold text-[#1C1C1C]">{review.user?.name || "Guest"}</p>
            <p className="text-[11px] text-[#9B8BAB]">{date}</p>
          </div>
        </div>
        <StarRating rating={review.rating} size={14} />
      </div>
      {review.title && (
        <p className="text-[13.5px] font-semibold text-[#1C1C1C]">{review.title}</p>
      )}
      {review.body && (
        <p className="text-[13px] text-[#6B5B7A] leading-relaxed">{review.body}</p>
      )}
    </div>
  );
}

export default async function RoomProfilePage({ params }) {
  const { roomId } = await params;

  let room, reviews, reviewStatus;
  try {
    [room, reviews] = await Promise.all([
      getRoomProfile(roomId),
      getReviewsForRoom(roomId),
    ]);
  } catch {
    notFound();
  }

  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    reviewStatus = await canUserReview(roomId, session.user.id);
  } else {
    reviewStatus = { canReview: false, bookingId: null, alreadyReviewed: false };
  }

  const category = room.category;
  const variant = room.variantId && category?.variants?.length
    ? category.variants.find((v) => String(v._id) === String(room.variantId)) ?? null
    : null;
  const property = room.property;

  return (
    <div className="min-h-screen bg-[#F7F4F0]">
      {/* Hero */}
      <div className="relative h-72 sm:h-96 bg-[#1C1C1C] overflow-hidden">
        {room.coverImage ? (
          <img src={room.coverImage} alt={`Room ${room.roomNumber}`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#2a1024] to-[#1C1C1C]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#7A2267]/60 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 px-6 py-8 max-w-4xl mx-auto">
          {property && (
            <p className="text-[9px] uppercase tracking-[0.3em] text-[#D4A8E0] font-medium mb-2">
              {property.name}
            </p>
          )}
          <h1 className={`text-[2.8rem] sm:text-[3.5rem] font-light text-white leading-none ${cormorant.className}`}>
            Room <em className="italic text-[#D4A8E0]">#{room.roomNumber}</em>
          </h1>
          <p className="text-white/55 text-[13px] mt-1.5">Floor {room.floor}</p>
          {room.avgRating > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <StarRating rating={room.avgRating} size={15} />
              <span className="text-white/70 text-[12.5px]">
                {room.avgRating} ({room.reviewCount} review{room.reviewCount !== 1 ? "s" : ""})
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        {/* Category details */}
        {category && (
          <div className="bg-white border border-[#EDE5F0] rounded-2xl p-6">
            <p className="text-[9.5px] uppercase tracking-[0.18em] text-[#9B8BAB] font-semibold mb-4">Room Details</p>
            {variant && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[12px] font-semibold text-[#7A2267] bg-[#7A2267]/6 px-3 py-1 rounded-full border border-[#7A2267]/20">
                  {variant.name}
                </span>
                <span className="text-[11px] text-[#9B8BAB]">room type</span>
              </div>
            )}
            <div className="flex flex-wrap gap-2 mb-4">
              {(variant?.bedType ?? category?.bedType) && (
                <span className="text-[12px] text-[#7A2267] bg-[#7A2267]/6 px-3 py-1 rounded-full border border-[#7A2267]/15 font-medium">
                  {variant?.bedType ?? category.bedType} Bed
                </span>
              )}
              {category?.size && (
                <span className="text-[12px] text-[#9B8BAB] bg-[#F3EDF5] px-3 py-1 rounded-full border border-[#EDE5F0]">
                  {category.size}
                </span>
              )}
              {(variant?.maxAdults ?? category?.maxAdults) > 0 && (
                <span className="text-[12px] text-[#9B8BAB] bg-[#F3EDF5] px-3 py-1 rounded-full border border-[#EDE5F0]">
                  Up to {variant?.maxAdults ?? category.maxAdults} adults
                </span>
              )}
              {(variant?.maxChildren ?? category?.maxChildren) > 0 && (
                <span className="text-[12px] text-[#9B8BAB] bg-[#F3EDF5] px-3 py-1 rounded-full border border-[#EDE5F0]">
                  Up to {variant?.maxChildren ?? category.maxChildren} children
                </span>
              )}
              {(() => {
                const ep = room.pricePerNight > 0
                  ? room.pricePerNight
                  : (variant?.pricePerNight ?? category?.pricePerNight);
                return ep > 0 ? (
                  <span className="text-[13px] font-bold text-[#7A2267] bg-[#7A2267]/6 px-3 py-1 rounded-full border border-[#7A2267]/15">
                    ৳{ep.toLocaleString()} / night
                  </span>
                ) : null;
              })()}
            </div>
            {category.amenities?.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-[#B8A4C2] font-semibold mb-2">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {category.amenities.map((a, i) => (
                    <span key={i} className="text-[12px] text-[#6B5B7A] bg-[#F7F4F0] px-2.5 py-0.5 rounded-lg border border-[#EDE5F0]">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Facilities */}
        {room.facilities?.length > 0 && (
          <div className="bg-white border border-[#EDE5F0] rounded-2xl p-6">
            <p className="text-[9.5px] uppercase tracking-[0.18em] text-[#9B8BAB] font-semibold mb-4">Facilities</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {room.facilities.map((f, i) => (
                <div key={i} className="flex items-center gap-2.5 bg-[#F7F4F0] border border-[#EDE5F0] rounded-xl px-3 py-2.5">
                  {f.icon && <span className="text-[1.1rem]">{f.icon}</span>}
                  <span className="text-[12.5px] text-[#1C1C1C] font-medium">{f.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Extra amenities */}
        {room.extraAmenities?.length > 0 && (
          <div className="bg-white border border-[#EDE5F0] rounded-2xl p-6">
            <p className="text-[9.5px] uppercase tracking-[0.18em] text-[#9B8BAB] font-semibold mb-4">Additional Amenities</p>
            <div className="flex flex-wrap gap-2">
              {room.extraAmenities.map((a, i) => (
                <span key={i} className="flex items-center gap-1.5 text-[12.5px] text-[#6B5B7A] bg-[#F7F4F0] px-3 py-1.5 rounded-xl border border-[#EDE5F0]">
                  <svg viewBox="0 0 10 10" width="9" height="9" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="#7A2267" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {room.description && (
          <div className="bg-white border border-[#EDE5F0] rounded-2xl p-6">
            <p className="text-[9.5px] uppercase tracking-[0.18em] text-[#9B8BAB] font-semibold mb-3">About This Room</p>
            <p className="text-[14px] text-[#4A3A5A] leading-relaxed whitespace-pre-wrap">{room.description}</p>
          </div>
        )}

        {/* Gallery + Videos — interactive lightbox */}
        <RoomGallery
          coverImage={room.coverImage}
          images={room.images}
          videos={room.videos}
          roomNumber={room.roomNumber}
        />

        {/* Reviews */}
        <div className="bg-white border border-[#EDE5F0] rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9.5px] uppercase tracking-[0.18em] text-[#9B8BAB] font-semibold">Guest Reviews</p>
              {room.avgRating > 0 && (
                <div className="flex items-center gap-2 mt-1.5">
                  <StarRating rating={room.avgRating} />
                  <span className="text-[15px] font-bold text-[#7A2267]">{room.avgRating}</span>
                  <span className="text-[12px] text-[#9B8BAB]">({room.reviewCount} review{room.reviewCount !== 1 ? "s" : ""})</span>
                </div>
              )}
            </div>
          </div>

          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((r) => <ReviewCard key={r._id} review={r} />)}
            </div>
          ) : (
            <p className="text-[13px] text-[#9B8BAB] py-4 text-center">No reviews yet. Be the first to review this room.</p>
          )}

          {/* Write review */}
          {reviewStatus.canReview && (
            <ReviewForm roomId={roomId} bookingId={reviewStatus.bookingId} />
          )}
          {reviewStatus.alreadyReviewed && (
            <p className="text-[12px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-xl">
              You have already reviewed this room. Thank you for your feedback!
            </p>
          )}
          {!session && (
            <p className="text-[12px] text-[#9B8BAB] text-center">
              <a href="/login" className="text-[#7A2267] font-semibold hover:underline">Sign in</a> to leave a review after your stay.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
