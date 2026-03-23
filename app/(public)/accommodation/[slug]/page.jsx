import { notFound } from "next/navigation";
import Link from "next/link";
import { getPropertyBySlug } from "@/actions/accommodation/propertyActions";

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

function AmenityChip({ label }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px] text-neutral-600 bg-neutral-100 px-3 py-1.5 rounded-full">
      {label}
    </span>
  );
}

function CategoryCard({ category, propertySlug }) {
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
          <p className="text-[13px] font-bold text-neutral-700 shrink-0">
            ৳{category.pricePerNight?.toLocaleString()}<span className="text-[10px] font-normal text-neutral-400">/night</span>
          </p>
        </div>
        {category.description && (
          <p className="text-[12px] text-neutral-500 line-clamp-2 mb-2">{category.description}</p>
        )}
        <div className="flex flex-wrap gap-2 text-[11px] text-neutral-400">
          {category.bedType && <span>{category.bedType} bed</span>}
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

export default async function PropertyPage({ params }) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property || !property.isActive) notFound();

  const isCottage  = property.type === "cottage";
  const isBuilding = property.type === "building";

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
          <div className="lg:col-span-2 space-y-8">
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
                <h2 className="text-[17px] font-bold text-neutral-800 mb-3">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((a) => <AmenityChip key={a} label={a} />)}
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
              <div>
                <h2 className="text-[17px] font-bold text-neutral-800 mb-3">Gallery</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {property.images.map((src, i) => (
                    <div key={i} className="aspect-video rounded-xl overflow-hidden bg-neutral-100">
                      <img src={src} alt={`${property.name} ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              </div>
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
              <div className="bg-white border border-neutral-100 rounded-2xl p-5 shadow-sm">
                <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold mb-3">Quick Info</p>
                <dl className="space-y-2 text-[12.5px]">
                  {property.totalFloors && (
                    <div className="flex justify-between">
                      <dt className="text-neutral-400">Floors</dt>
                      <dd className="text-neutral-700 font-medium">{property.totalFloors}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-neutral-400">Categories</dt>
                    <dd className="text-neutral-700 font-medium">{property.categories?.length ?? 0}</dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
