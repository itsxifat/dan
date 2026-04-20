import { notFound } from "next/navigation";
import Link from "next/link";
import { Lora, Josefin_Sans } from "next/font/google";
import { getPropertyBySlug } from "@/actions/accommodation/propertyActions";
import { getAmenities } from "@/actions/accommodation/amenityActions";
import { ICON_MAP } from "@/lib/iconLibrary";
import PropertyGallery from "./PropertyGallery";

const lora    = Lora({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"] });
const josefin = Josefin_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) return { title: "Not Found" };
  return {
    title: `${property.name} — Dhali's Amber Nivaas`,
    description: property.tagline || property.description,
  };
}

export const dynamic = "force-dynamic";

// ── Amenity rendering ─────────────────────────────────────────────────────────
function AmenityIcon({ amenity, size = 20 }) {
  if (!amenity?.iconValue) {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/>
      </svg>
    );
  }
  if (amenity.iconType === "upload") {
    return <img src={amenity.iconValue} alt="" width={size} height={size} className="object-contain" />;
  }
  const icon = ICON_MAP[amenity.iconValue];
  if (!icon) return null;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" dangerouslySetInnerHTML={{ __html: icon.d }} />
  );
}

function AmenityCard({ label, amenityMap }) {
  const amenity = amenityMap[label];
  return (
    <div className={`${josefin.className} flex flex-col items-center gap-2.5 p-4 bg-white border border-[#ede5d8] rounded-2xl
      hover:border-[#7A2267]/40 hover:shadow-md transition-all duration-200 text-center group`}>
      <div className="w-10 h-10 rounded-xl bg-[#7A2267]/8 flex items-center justify-center
        text-[#7A2267] group-hover:bg-[#7A2267] group-hover:text-white transition-all duration-300">
        <AmenityIcon amenity={amenity} size={20} />
      </div>
      <span className="text-[11.5px] font-medium text-[#6b5e4a] leading-tight">{label}</span>
    </div>
  );
}

function CategoryCard({ category, propertySlug }) {
  const variants = category.variants ?? [];
  const prices   = variants.map((v) => v.pricePerNight).filter((p) => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
  const bedTypes = [...new Set(variants.map((v) => v.bedType).filter(Boolean))];

  return (
    <Link
      href={`/accommodation/${propertySlug}/${category.slug}`}
      className="group flex gap-4 p-4 bg-white border border-[#ede5d8] rounded-2xl
        hover:border-[#7A2267]/40 hover:shadow-lg transition-all duration-300"
    >
      {category.coverImage && (
        <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-[#f0ebe0]">
          <img src={category.coverImage} alt={category.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className={`${lora.className} text-[15px] font-medium text-[#1a1309] group-hover:text-[#7A2267] transition-colors`}>
            {category.name}
          </h3>
          <div className="text-right shrink-0">
            {minPrice != null ? (
              <>
                <p className={`${josefin.className} text-[13px] font-semibold text-[#1a1309]`}>
                  ৳{minPrice.toLocaleString()}
                  {maxPrice !== minPrice && <span className="font-normal text-[#7a6a52]"> – ৳{maxPrice.toLocaleString()}</span>}
                </p>
                <p className={`${josefin.className} text-[10px] text-[#9b8e78]`}>per night</p>
              </>
            ) : (
              <p className={`${josefin.className} text-[11px] text-[#9b8e78]`}>Enquire</p>
            )}
          </div>
        </div>
        {category.description && (
          <p className={`${josefin.className} text-[12px] font-light text-[#7a6a52] line-clamp-2 mb-2`}>{category.description}</p>
        )}
        {variants.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {variants.map((v) => (
              <span key={String(v._id)} className={`${josefin.className} text-[10px] text-[#7A2267]/70 bg-[#7A2267]/5 border border-[#7A2267]/15 px-2 py-0.5 rounded-full`}>
                {v.name}
              </span>
            ))}
          </div>
        )}
        <div className={`${josefin.className} flex flex-wrap gap-2 text-[11px] text-[#9b8e78]`}>
          {bedTypes.length > 0 && <span>{bedTypes.join(", ")} bed</span>}
          {category.size && <span>· {category.size}</span>}
          {category.maxAdults && <span>· Up to {category.maxAdults} adults</span>}
          {category.roomStats && category.roomStats.available > 0 && (
            <span className="font-semibold text-emerald-600">
              · {category.roomStats.available} of {category.roomStats.total} available
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function PropertyPage({ params }) {
  const { slug } = await params;

  const [property, dbAmenities] = await Promise.all([
    getPropertyBySlug(slug),
    getAmenities({ onlyActive: true }),
  ]);

  if (!property || !property.isActive) notFound();

  const amenityMap = Object.fromEntries(dbAmenities.map((a) => [a.name, a]));

  const isCottage  = property.type === "cottage";
  const isBuilding = property.type === "building";
  const hasBlocks  = property.blocks?.length > 0;

  return (
    <main className="min-h-screen bg-[#f9f6f2] overflow-x-hidden">

      {/* ── Hero ── */}
      <div className="relative min-h-[55vh] flex flex-col justify-end overflow-hidden bg-[#1a1309]">
        {property.coverImage && (
          <>
            <img src={property.coverImage} alt={property.name}
              className="absolute inset-0 w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#1a1309]/30 via-[#1a1309]/50 to-[#1a1309]/90" />
          </>
        )}
        {!property.coverImage && (
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse 70% 50% at 60% 30%, rgba(122,34,103,0.15) 0%, transparent 70%)" }} />
        )}

        <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 pb-12 pt-32 w-full">
          {/* Breadcrumb */}
          <div className={`${josefin.className} flex items-center gap-2 text-[9.5px] uppercase tracking-[0.18em] text-white/30 mb-8`}>
            <Link href="/" className="hover:text-white/60 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/accommodation" className="hover:text-white/60 transition-colors">Accommodation</Link>
            <span>/</span>
            <span className="text-white/55">{property.name}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-px w-10 bg-[#7A2267]/60" />
                <p className={`${josefin.className} text-[10px] uppercase tracking-[0.3em] font-semibold text-[#7A2267]`}>
                  {property.type}
                </p>
              </div>

              <h1 className={`${lora.className} text-[2.4rem] sm:text-[3rem] lg:text-[3.8rem]
                text-white leading-[1.1] tracking-[-0.01em]`}>
                {property.name}
              </h1>

              {property.location && (
                <p className={`${josefin.className} text-[13px] font-light text-white/50 mt-3 flex items-center gap-2`}>
                  <svg viewBox="0 0 12 16" width="10" height="12" fill="none">
                    <path d="M6 1a5 5 0 0 1 5 5c0 3.5-5 9-5 9S1 9.5 1 6a5 5 0 0 1 5-5Z"
                      stroke="currentColor" strokeWidth="1.3" />
                    <circle cx="6" cy="6" r="1.5" fill="currentColor" />
                  </svg>
                  {property.location}
                </p>
              )}
            </div>

            {(() => {
              const catPrices = (property.categories ?? [])
                .flatMap((c) => (c.variants ?? []).map((v) => v.pricePerNight).filter(Boolean));
              const minCatPrice = catPrices.length > 0 ? Math.min(...catPrices) : null;
              const displayPrice = minCatPrice ?? (isCottage && property.pricePerNight > 0 ? property.pricePerNight : null);
              return displayPrice ? (
                <div className="text-right">
                  <p className={`${josefin.className} text-[10px] uppercase tracking-[0.22em] text-white/40 mb-1`}>Starting from</p>
                  <p className={`${lora.className} text-[2.2rem] font-semibold text-white leading-none`}>
                    ৳{displayPrice.toLocaleString()}
                  </p>
                  <p className={`${josefin.className} text-[11px] text-white/40 mt-1`}>per night</p>
                </div>
              ) : null;
            })()}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Main content */}
          <div className="lg:col-span-2 space-y-12">

            {/* Description */}
            {property.description && (
              <div>
                <div className="flex items-center gap-4 mb-5">
                  <div className="h-px w-10 bg-[#7A2267]/30" />
                  <p className={`${josefin.className} text-[10px] uppercase tracking-[0.28em] font-semibold text-[#7A2267]/70`}>
                    About this Property
                  </p>
                </div>
                <p className={`${josefin.className} text-[14px] font-light text-[#6b5e4a] leading-[1.9] whitespace-pre-line`}>
                  {property.description}
                </p>
              </div>
            )}

            {/* Amenities */}
            {property.amenities?.length > 0 && (
              <div>
                <div className="flex items-center gap-4 mb-5">
                  <div className="h-px w-10 bg-[#7A2267]/30" />
                  <p className={`${josefin.className} text-[10px] uppercase tracking-[0.28em] font-semibold text-[#7A2267]/70`}>
                    Amenities Included
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {property.amenities.map((a) => (
                    <AmenityCard key={a} label={a} amenityMap={amenityMap} />
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            {property.categories?.length > 0 && (
              <div>
                <div className="flex items-center gap-4 mb-5">
                  <div className="h-px w-10 bg-[#7A2267]/30" />
                  <p className={`${josefin.className} text-[10px] uppercase tracking-[0.28em] font-semibold text-[#7A2267]/70`}>
                    Room Categories
                  </p>
                </div>
                <div className="space-y-3">
                  {property.categories.map((cat) => (
                    <CategoryCard key={cat._id} category={cat} propertySlug={property.slug} />
                  ))}
                </div>
              </div>
            )}

            {/* Gallery */}
            {property.images?.length > 0 && (
              <div>
                <div className="flex items-center gap-4 mb-5">
                  <div className="h-px w-10 bg-[#7A2267]/30" />
                  <p className={`${josefin.className} text-[10px] uppercase tracking-[0.28em] font-semibold text-[#7A2267]/70`}>
                    Gallery
                  </p>
                </div>
                <PropertyGallery images={property.images} propertyName={property.name} />
              </div>
            )}

            {/* Map */}
            {property.mapEmbedUrl && (
              <div>
                <div className="flex items-center gap-4 mb-5">
                  <div className="h-px w-10 bg-[#7A2267]/30" />
                  <p className={`${josefin.className} text-[10px] uppercase tracking-[0.28em] font-semibold text-[#7A2267]/70`}>
                    Location
                  </p>
                </div>
                <div className="rounded-2xl overflow-hidden border border-[#ede5d8]">
                  <iframe
                    src={property.mapEmbedUrl}
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`${property.name} map`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {isCottage && (
              <div className="bg-white border border-[#ede5d8] rounded-2xl p-6
                shadow-[0_8px_32px_-8px_rgba(26,19,9,0.10)] space-y-5 sticky top-24">
                <div className="text-center pb-4 border-b border-[#f0ebe0]">
                  <p className={`${josefin.className} text-[9.5px] uppercase tracking-[0.22em] text-[#9b8e78] mb-2`}>
                    Starting from
                  </p>
                  <p className={`${lora.className} text-[2rem] font-semibold text-[#1a1309] leading-none`}>
                    ৳{property.pricePerNight?.toLocaleString()}
                  </p>
                  <p className={`${josefin.className} text-[11px] text-[#9b8e78] mt-1`}>per night</p>
                  {property.maxGuests && (
                    <p className={`${josefin.className} text-[11px] text-[#9b8e78] mt-1`}>
                      Up to {property.maxGuests} guests
                    </p>
                  )}
                </div>
                <Link
                  href={`/booking?property=${property._id}&type=cottage`}
                  className={`${josefin.className} block w-full text-center py-3.5 rounded-xl
                    bg-[#7A2267] text-white text-[12px] font-semibold uppercase tracking-[0.18em]
                    hover:bg-[#8e2878] transition-colors duration-200`}
                >
                  Book Now
                </Link>
                <p className={`${josefin.className} text-[10px] text-[#9b8e78] text-center leading-relaxed`}>
                  No hidden charges · Free cancellation — check our policy
                </p>
              </div>
            )}

            {isBuilding && (
              <div className="bg-white border border-[#ede5d8] rounded-2xl p-5
                shadow-[0_8px_32px_-8px_rgba(26,19,9,0.10)] sticky top-24 space-y-4">
                <p className={`${josefin.className} text-[10px] uppercase tracking-[0.25em] text-[#9b8e78] font-semibold`}>
                  Quick Info
                </p>
                <dl className="space-y-3">
                  {property.totalFloors > 0 && (
                    <div className="flex justify-between items-center">
                      <dt className={`${josefin.className} text-[12px] text-[#9b8e78] flex items-center gap-1.5`}>
                        <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="2" y="2" width="12" height="12" rx="1"/><path d="M5 8h6M8 5v6"/>
                        </svg>
                        Floors
                      </dt>
                      <dd className={`${josefin.className} text-[12.5px] font-semibold text-[#1a1309]`}>{property.totalFloors}</dd>
                    </div>
                  )}
                  {hasBlocks && (
                    <div className="flex justify-between items-center">
                      <dt className={`${josefin.className} text-[12px] text-[#9b8e78] flex items-center gap-1.5`}>
                        <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M3 14V6l5-4 5 4v8"/><rect x="6" y="14" width="4" height="4"/>
                        </svg>
                        Blocks
                      </dt>
                      <dd className={`${josefin.className} text-[12.5px] font-semibold text-[#1a1309]`}>{property.blocks.length}</dd>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <dt className={`${josefin.className} text-[12px] text-[#9b8e78] flex items-center gap-1.5`}>
                      <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="1" y="4" width="14" height="10" rx="1"/>
                        <path d="M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/>
                      </svg>
                      Categories
                    </dt>
                    <dd className={`${josefin.className} text-[12.5px] font-semibold text-[#1a1309]`}>{property.categories?.length ?? 0}</dd>
                  </div>
                </dl>

                {property.amenities?.length > 0 && (
                  <div className="pt-3 border-t border-[#f0ebe0]">
                    <div className={`${josefin.className} flex items-center gap-2 text-[11.5px] text-[#7A2267]`}>
                      <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M8 1l1.85 3.74L14 5.73l-3 2.92.71 4.12L8 10.77 5.29 12.77 6 8.65 3 5.73l4.15-.99L8 1z"/>
                      </svg>
                      <span className="font-semibold">{property.amenities.length} amenities included</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Back link */}
            <Link href="/accommodation"
              className={`${josefin.className} flex items-center gap-2 text-[11px] text-[#9b8e78]
                hover:text-[#7A2267] transition-colors duration-200 font-medium uppercase tracking-[0.15em]`}>
              <svg viewBox="0 0 14 10" width="11" height="11" fill="none">
                <path d="M13 5H1M5 1L1 5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              All Accommodation
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
