import { notFound } from "next/navigation";
import Link from "next/link";
import { getPropertyBySlug } from "@/actions/accommodation/propertyActions";
import { getAmenities } from "@/actions/accommodation/amenityActions";
import { ICON_MAP } from "@/lib/iconLibrary";
import PropertyGallery from "./PropertyGallery";

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
  // library icon — render via dangerouslySetInnerHTML (admin-controlled content)
  const icon = ICON_MAP[amenity.iconValue];
  if (!icon) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      dangerouslySetInnerHTML={{ __html: icon.d }}
    />
  );
}

function AmenityCard({ label, amenityMap }) {
  const amenity = amenityMap[label];
  return (
    <div className="flex flex-col items-center gap-2.5 p-4 bg-white border border-neutral-100 rounded-2xl
      hover:border-[#7A2267]/30 hover:shadow-md transition-all duration-200 text-center group">
      <div className="w-10 h-10 rounded-xl bg-[#7A2267]/8 flex items-center justify-center
        text-[#7A2267] group-hover:bg-[#7A2267]/15 transition-colors duration-200">
        <AmenityIcon amenity={amenity} size={20} />
      </div>
      <span className="text-[11.5px] font-medium text-neutral-600 leading-tight">{label}</span>
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
      className="group flex gap-4 p-4 bg-white border border-neutral-100 rounded-2xl
        hover:border-[#7A2267]/30 hover:shadow-lg transition-all duration-300"
    >
      {category.coverImage && (
        <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-neutral-100">
          <img src={category.coverImage} alt={category.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-[14px] font-semibold text-neutral-800 group-hover:text-[#7A2267] transition-colors">
            {category.name}
          </h3>
          <div className="text-right shrink-0">
            {minPrice != null ? (
              <>
                <p className="text-[13px] font-bold text-neutral-700">
                  ৳{minPrice.toLocaleString()}
                  {maxPrice !== minPrice && <span className="font-normal text-neutral-500"> – ৳{maxPrice.toLocaleString()}</span>}
                </p>
                <p className="text-[10px] text-neutral-400">per night</p>
              </>
            ) : (
              <p className="text-[11px] text-neutral-400">Enquire</p>
            )}
          </div>
        </div>
        {category.description && (
          <p className="text-[12px] text-neutral-500 line-clamp-2 mb-2">{category.description}</p>
        )}
        {variants.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {variants.map((v) => (
              <span key={String(v._id)} className="text-[10px] text-[#7A2267]/70 bg-[#7A2267]/5 border border-[#7A2267]/15 px-2 py-0.5 rounded-full">
                {v.name}
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2 text-[11px] text-neutral-400">
          {bedTypes.length > 0 && <span>{bedTypes.join(", ")} bed</span>}
          {category.size && <span>· {category.size}</span>}
          {category.maxAdults && <span>· Up to {category.maxAdults} adults</span>}
          {category.roomStats && (
            <span className={`font-medium ${category.roomStats.available > 0 ? "text-emerald-600" : "text-red-400"}`}>
              · {category.roomStats.available > 0 ? `${category.roomStats.available} available` : "Fully booked"}
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

  // Build name → amenity object map for icon lookup
  const amenityMap = Object.fromEntries(dbAmenities.map((a) => [a.name, a]));

  const isCottage  = property.type === "cottage";
  const isBuilding = property.type === "building";
  const hasBlocks  = isBuilding && property.blocks?.length > 0;

  return (
    <main className="min-h-screen bg-[#fcfcfc]">
      {/* Hero Image */}
      {property.coverImage && (
        <div className="relative h-[45vh] min-h-[280px] overflow-hidden">
          <img src={property.coverImage} alt={property.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 max-w-6xl mx-auto">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#c05aae] font-semibold mb-2">
                  {property.type}
                </p>
                <h1 className="text-[28px] sm:text-[38px] font-bold text-white leading-tight">{property.name}</h1>
                {property.location && (
                  <p className="text-[13px] text-white/60 mt-1 flex items-center gap-1.5">
                    <svg viewBox="0 0 12 16" width="9" height="11" fill="none">
                      <path d="M6 1a5 5 0 0 1 5 5c0 3.5-5 9-5 9S1 9.5 1 6a5 5 0 0 1 5-5Z" stroke="currentColor" strokeWidth="1.3" />
                      <circle cx="6" cy="6" r="1.5" fill="currentColor" />
                    </svg>
                    {property.location}
                  </p>
                )}
              </div>
              {isCottage && property.pricePerNight > 0 && (
                <div className="text-right">
                  <p className="text-[24px] font-bold text-white">
                    ৳{property.pricePerNight.toLocaleString()}
                    <span className="text-[14px] font-normal text-white/50">/night</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[12px] text-neutral-400">
          <Link href="/accommodation" className="hover:text-[#7A2267] transition-colors">Accommodation</Link>
          <span>/</span>
          <span className="text-neutral-700">{property.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Description */}
            {property.description && (
              <div>
                <h2 className="text-[17px] font-bold text-neutral-800 mb-3">About this property</h2>
                <p className="text-[14px] text-neutral-600 leading-relaxed whitespace-pre-line">{property.description}</p>
              </div>
            )}

            {/* Amenities */}
            {property.amenities?.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-[#7A2267]/10 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#7A2267" strokeWidth="1.8">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-[17px] font-bold text-neutral-800">Amenities</h2>
                    <p className="text-[12px] text-neutral-400">{property.amenities.length} features included</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {property.amenities.map((a) => (
                    <AmenityCard key={a} label={a} amenityMap={amenityMap} />
                  ))}
                </div>
              </div>
            )}

            {/* Categories (buildings) */}
            {isBuilding && property.categories?.length > 0 && (
              <div>
                <h2 className="text-[17px] font-bold text-neutral-800 mb-4">Room Categories</h2>
                <div className="space-y-3">
                  {property.categories.map((cat) => (
                    <CategoryCard key={cat._id} category={cat} propertySlug={property.slug} />
                  ))}
                </div>
              </div>
            )}

            {/* Gallery */}
            {property.images?.length > 0 && (
              <PropertyGallery images={property.images} propertyName={property.name} />
            )}

            {/* Map */}
            {property.mapEmbedUrl && (
              <div>
                <h2 className="text-[17px] font-bold text-neutral-800 mb-3">Location</h2>
                <div className="rounded-2xl overflow-hidden border border-neutral-100">
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
              <div className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-sm space-y-4 sticky top-24">
                <div className="text-center">
                  <p className="text-[28px] font-bold text-neutral-800">
                    ৳{property.pricePerNight?.toLocaleString()}
                    <span className="text-[14px] font-normal text-neutral-400">/night</span>
                  </p>
                  {property.maxGuests && (
                    <p className="text-[12px] text-neutral-400 mt-1">Up to {property.maxGuests} guests</p>
                  )}
                </div>
                <Link
                  href={`/booking?property=${property._id}&type=cottage`}
                  className="block w-full text-center py-3 rounded-xl bg-[#7A2267] text-white text-[13.5px]
                    font-semibold hover:bg-[#8e2878] transition-colors duration-200"
                >
                  Book Now
                </Link>
                <p className="text-[10.5px] text-neutral-400 text-center">No hidden charges · Free cancellation check our policy</p>
              </div>
            )}

            {isBuilding && (
              <div className="bg-white border border-neutral-100 rounded-2xl p-5 shadow-sm sticky top-24 space-y-4">
                <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">Quick Info</p>
                <dl className="space-y-2.5 text-[12.5px]">
                  {property.totalFloors > 0 && (
                    <div className="flex justify-between items-center">
                      <dt className="text-neutral-400 flex items-center gap-1.5">
                        <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="2" y="2" width="12" height="12" rx="1"/>
                          <path d="M5 8h6M8 5v6"/>
                        </svg>
                        Floors
                      </dt>
                      <dd className="text-neutral-700 font-semibold">{property.totalFloors}</dd>
                    </div>
                  )}
                  {hasBlocks && (
                    <div className="flex justify-between items-center">
                      <dt className="text-neutral-400 flex items-center gap-1.5">
                        <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M3 14V6l5-4 5 4v8"/><rect x="6" y="14" width="4" height="4"/>
                        </svg>
                        Blocks
                      </dt>
                      <dd className="text-neutral-700 font-semibold">{property.blocks.length}</dd>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <dt className="text-neutral-400 flex items-center gap-1.5">
                      <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="1" y="4" width="14" height="10" rx="1"/>
                        <path d="M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/>
                      </svg>
                      Categories
                    </dt>
                    <dd className="text-neutral-700 font-semibold">{property.categories?.length ?? 0}</dd>
                  </div>
                </dl>

                {property.amenities?.length > 0 && (
                  <div className="pt-3 border-t border-neutral-100">
                    <div className="flex items-center gap-2 text-[11.5px] text-[#7A2267]">
                      <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M8 1l1.85 3.74L14 5.73l-3 2.92.71 4.12L8 10.77 5.29 12.77 6 8.65 3 5.73l4.15-.99L8 1z"/>
                      </svg>
                      <span className="font-medium">{property.amenities.length} amenities included</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
