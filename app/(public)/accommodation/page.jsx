import Link from "next/link";
import { getProperties } from "@/actions/accommodation/propertyActions";

export const metadata = {
  title: "Accommodation — Dhali's Amber Nivaas",
  description: "Explore our premium buildings, suites, and cottages. Choose from a range of handcrafted accommodation options.",
};

export const dynamic = "force-dynamic";

const TYPE_BADGE = {
  building: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  cottage:  "bg-emerald-600/10 text-emerald-700 border-emerald-600/20",
};

function PropertyCard({ property }) {
  return (
    <Link
      href={`/accommodation/${property.slug}`}
      className="group block bg-white border border-neutral-100 rounded-2xl overflow-hidden
        hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden bg-neutral-100">
        {property.coverImage ? (
          <img
            src={property.coverImage}
            alt={property.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300">
            <svg viewBox="0 0 48 48" width="40" height="40" fill="none">
              <path d="M6 42V21L24 6l18 15v21" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        )}
        {property.isFeatured && (
          <div className="absolute top-3 left-3 text-[9.5px] uppercase tracking-wider font-semibold
            px-2.5 py-1 rounded-full bg-[#7A2267] text-white">
            Featured
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className={`text-[9.5px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full border ${TYPE_BADGE[property.type]}`}>
            {property.type}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-5">
        <h3 className="text-[15px] font-semibold text-neutral-800 group-hover:text-[#7A2267] transition-colors duration-200 mb-1">
          {property.name}
        </h3>
        {property.tagline && (
          <p className="text-[12.5px] text-neutral-500 mb-3 line-clamp-2">{property.tagline}</p>
        )}
        {property.location && (
          <p className="text-[11.5px] text-neutral-400 flex items-center gap-1.5">
            <svg viewBox="0 0 12 16" width="9" height="11" fill="none">
              <path d="M6 1a5 5 0 0 1 5 5c0 3.5-5 9-5 9S1 9.5 1 6a5 5 0 0 1 5-5Z" stroke="currentColor" strokeWidth="1.3" />
              <circle cx="6" cy="6" r="1.5" fill="currentColor" />
            </svg>
            {property.location}
          </p>
        )}
        <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
          {property.type === "building" ? (
            <span className="text-[12px] text-neutral-400">
              {property.roomStats?.available ?? 0} rooms available
            </span>
          ) : (
            <span className="text-[12px] text-neutral-500 font-medium">
              {property.pricePerNight > 0 ? `৳${property.pricePerNight.toLocaleString()}/night` : "Contact for pricing"}
            </span>
          )}
          <span className="text-[12px] text-[#7A2267] font-medium group-hover:underline">
            View details →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function AccommodationListPage({ searchParams }) {
  const params = await searchParams;
  const type   = params?.type || "";

  const { properties } = await getProperties({ onlyActive: true, type, limit: 50 });

  const buildings = properties.filter((p) => p.type === "building");
  const cottages  = properties.filter((p) => p.type === "cottage");

  return (
    <main className="min-h-screen bg-[#fcfcfc]">
      {/* Hero */}
      <section className="bg-[#0d0d0d] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[9.5px] uppercase tracking-[0.3em] text-[#c05aae] font-semibold mb-4">Accommodation</p>
          <h1 className="text-[36px] sm:text-[48px] font-bold leading-tight mb-5">
            Find Your Perfect Stay
          </h1>
          <p className="text-[15px] text-white/50 max-w-xl mx-auto">
            From spacious suites in our signature towers to intimate private cottages — every space is crafted for luxury.
          </p>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-neutral-100 px-4">
        <div className="max-w-6xl mx-auto flex gap-6 overflow-x-auto scrollbar-hide py-3">
          {[["", "All"], ["building", "Buildings"], ["cottage", "Cottages"]].map(([v, label]) => (
            <Link
              key={v}
              href={v ? `/accommodation?type=${v}` : "/accommodation"}
              className={`shrink-0 text-[12.5px] font-medium pb-2 border-b-2 transition-all duration-200
                ${type === v
                  ? "border-[#7A2267] text-[#7A2267]"
                  : "border-transparent text-neutral-400 hover:text-neutral-700"
                }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-14">
        {/* Buildings */}
        {(!type || type === "building") && buildings.length > 0 && (
          <section>
            <div className="mb-6">
              <h2 className="text-[20px] font-bold text-neutral-800">Buildings & Suites</h2>
              <p className="text-[13px] text-neutral-500 mt-1">Select a building to explore room categories and availability.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {buildings.map((p) => <PropertyCard key={p._id} property={p} />)}
            </div>
          </section>
        )}

        {/* Cottages */}
        {(!type || type === "cottage") && cottages.length > 0 && (
          <section>
            <div className="mb-6">
              <h2 className="text-[20px] font-bold text-neutral-800">Private Cottages</h2>
              <p className="text-[13px] text-neutral-500 mt-1">Exclusive standalone cottages with complete privacy.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cottages.map((p) => <PropertyCard key={p._id} property={p} />)}
            </div>
          </section>
        )}

        {properties.length === 0 && (
          <div className="text-center py-24 text-neutral-400 text-[15px]">
            No accommodation available at the moment. Please check back soon.
          </div>
        )}
      </div>
    </main>
  );
}
