import { notFound } from "next/navigation";
import Link from "next/link";
import { Lora, Josefin_Sans } from "next/font/google";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import { getCategoryBySlug } from "@/actions/accommodation/categoryActions";
import CategoryRoomsGrid from "./CategoryRoomsGrid";

const lora    = Lora({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"] });
const josefin = Josefin_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });

export async function generateMetadata({ params }) {
  const { slug, categorySlug } = await params;
  await dbConnect();
  const property = await Property.findOne({ slug }).lean();
  if (!property) return { title: "Not Found" };
  const category = await getCategoryBySlug(property._id.toString(), categorySlug);
  if (!category) return { title: "Not Found" };
  return {
    title: `${category.name} — ${property.name} | Dhali's Amber Nivaas`,
    description: category.description,
  };
}

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }) {
  const { slug, categorySlug } = await params;

  await dbConnect();
  const property = await Property.findOne({ slug, isActive: true }).lean();
  if (!property) notFound();

  const category = await getCategoryBySlug(property._id.toString(), categorySlug);
  if (!category || !category.isActive) notFound();

  const allRooms       = category.rooms ?? [];
  const availableRooms = allRooms.filter((r) => r.status === "available");

  const prices  = (category.variants ?? []).map((v) => v.pricePerNight).filter(Boolean);
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : null;

  return (
    <main className="min-h-screen bg-[#f9f6f2] overflow-x-hidden">

      {/* ── Hero ── */}
      <div className="relative min-h-[52vh] flex flex-col justify-end overflow-hidden bg-[#1a1309]">
        {category.coverImage && (
          <>
            <img src={category.coverImage} alt={category.name}
              className="absolute inset-0 w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#1a1309]/30 via-[#1a1309]/50 to-[#1a1309]/90" />
          </>
        )}
        {!category.coverImage && (
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse 70% 50% at 60% 30%, rgba(122,34,103,0.15) 0%, transparent 70%)" }} />
        )}

        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 lg:px-12 pb-12 pt-32 w-full">
          <div className={`${josefin.className} flex items-center gap-2 text-[9.5px] uppercase tracking-[0.18em] text-white/30 mb-8`}>
            <Link href="/" className="hover:text-white/60 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/accommodation" className="hover:text-white/60 transition-colors">Accommodation</Link>
            <span>/</span>
            <Link href={`/accommodation/${slug}`} className="hover:text-white/60 transition-colors">{property.name}</Link>
            <span>/</span>
            <span className="text-white/55">{category.name}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-px w-10 bg-[#7A2267]/60" />
                <p className={`${josefin.className} text-[10px] uppercase tracking-[0.3em] font-semibold text-[#7A2267]`}>
                  {property.name}
                </p>
              </div>
              <h1 className={`${lora.className} text-[2.2rem] sm:text-[2.8rem] lg:text-[3.4rem]
                text-white leading-[1.1] tracking-[-0.01em]`}>
                {category.name}
              </h1>
            </div>

            {minPrice != null && (
              <div className="text-right">
                <p className={`${josefin.className} text-[10px] uppercase tracking-[0.22em] text-white/40 mb-1`}>From</p>
                <p className={`${lora.className} text-[2rem] font-semibold text-white leading-none`}>
                  ৳{minPrice.toLocaleString()}
                </p>
                <p className={`${josefin.className} text-[11px] text-white/40 mt-1`}>per night</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Main */}
          <div className="lg:col-span-2 space-y-10">

            {/* Description + specs card */}
            <div className="bg-white border border-[#ede5d8] rounded-2xl p-6 space-y-5
              shadow-[0_4px_24px_-6px_rgba(26,19,9,0.08)]">
              {category.description && (
                <p className={`${josefin.className} text-[14px] font-light text-[#6b5e4a] leading-[1.9]`}>
                  {category.description}
                </p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#f0ebe0]">
                {[
                  { label: "Bed Type", value: category.variants?.length > 0
                      ? [...new Set(category.variants.map((v) => v.bedType).filter(Boolean))].join(", ")
                      : null },
                  { label: "Room Size",   value: category.size },
                  { label: "Max Adults",  value: category.maxAdults },
                  { label: "Floor Range", value: category.floorRange },
                ].filter((f) => f.value).map(({ label, value }) => (
                  <div key={label}>
                    <p className={`${josefin.className} text-[9px] uppercase tracking-[0.22em] text-[#9b8e78] font-semibold mb-1`}>
                      {label}
                    </p>
                    <p className={`${josefin.className} text-[13px] font-medium text-[#1a1309]`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Variants pricing */}
            {category.variants?.length > 0 && (
              <div>
                <div className="flex items-center gap-4 mb-5">
                  <div className="h-px w-10 bg-[#7A2267]/30" />
                  <p className={`${josefin.className} text-[10px] uppercase tracking-[0.28em] font-semibold text-[#7A2267]/70`}>
                    Room Types &amp; Pricing
                  </p>
                </div>
                <div className="space-y-2">
                  {category.variants.map((v) => (
                    <div key={v._id} className="flex items-center justify-between p-4 bg-white rounded-xl
                      border border-[#ede5d8] hover:border-[#7A2267]/30 transition-colors duration-200">
                      <div>
                        <p className={`${josefin.className} text-[13px] font-semibold text-[#1a1309]`}>{v.name}</p>
                        <div className={`${josefin.className} flex gap-2 mt-0.5 text-[11px] text-[#9b8e78]`}>
                          {v.bedType && <span>{v.bedType} bed</span>}
                          {v.maxAdults && <span>· {v.maxAdults} adults</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`${lora.className} text-[1.2rem] font-semibold text-[#1a1309]`}>
                          ৳{v.pricePerNight.toLocaleString()}
                        </p>
                        <p className={`${josefin.className} text-[10px] text-[#9b8e78]`}>per night</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Amenities */}
            {category.amenities?.length > 0 && (
              <div>
                <div className="flex items-center gap-4 mb-5">
                  <div className="h-px w-10 bg-[#7A2267]/30" />
                  <p className={`${josefin.className} text-[10px] uppercase tracking-[0.28em] font-semibold text-[#7A2267]/70`}>
                    Room Amenities
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {category.amenities.map((a) => (
                    <span key={a} className={`${josefin.className} text-[11.5px] font-light text-[#6b5e4a]
                      bg-white border border-[#ede5d8] px-3 py-1.5 rounded-full
                      hover:border-[#7A2267]/30 transition-colors duration-200`}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Rooms grid */}
            {allRooms.length > 0 ? (
              <div>
                <div className="flex items-center gap-4 mb-5">
                  <div className="h-px w-10 bg-[#7A2267]/30" />
                  <p className={`${josefin.className} text-[10px] uppercase tracking-[0.28em] font-semibold text-[#7A2267]/70`}>
                    Available Rooms
                  </p>
                </div>
                <CategoryRoomsGrid rooms={allRooms} category={category} />
              </div>
            ) : (
              <p className={`${josefin.className} text-[13px] text-[#9b8e78]`}>No rooms configured yet.</p>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <div className="bg-white border border-[#ede5d8] rounded-2xl p-6
              shadow-[0_8px_32px_-8px_rgba(26,19,9,0.10)] space-y-5 sticky top-24">

              {minPrice != null && (
                <div className="text-center pb-4 border-b border-[#f0ebe0]">
                  <p className={`${josefin.className} text-[9.5px] uppercase tracking-[0.22em] text-[#9b8e78] mb-2`}>From</p>
                  <p className={`${lora.className} text-[1.9rem] font-semibold text-[#1a1309] leading-none`}>
                    ৳{minPrice.toLocaleString()}
                    {maxPrice !== minPrice && (
                      <span className={`${josefin.className} text-[14px] font-normal text-[#9b8e78]`}>
                        {" "}– ৳{maxPrice.toLocaleString()}
                      </span>
                    )}
                  </p>
                  <p className={`${josefin.className} text-[11px] text-[#9b8e78] mt-1`}>per night</p>
                  {availableRooms.length > 0 ? (
                    <p className={`${josefin.className} text-[11px] text-emerald-600 font-semibold mt-2`}>
                      {availableRooms.length} room{availableRooms.length !== 1 ? "s" : ""} available now
                    </p>
                  ) : allRooms.length > 0 ? (
                    <p className={`${josefin.className} text-[11px] text-[#9b8e78] mt-2`}>
                      {allRooms.length} room{allRooms.length !== 1 ? "s" : ""}
                    </p>
                  ) : null}
                </div>
              )}

              <Link
                href={`/booking?property=${property._id}&category=${category._id}`}
                className={`${josefin.className} block w-full text-center py-3.5 rounded-xl
                  bg-[#7A2267] text-white text-[12px] font-semibold uppercase tracking-[0.18em]
                  hover:bg-[#8e2878] transition-colors duration-200`}
              >
                Check Availability &amp; Book
              </Link>

              <div className="space-y-3 text-[12px]">
                <div className="flex justify-between items-center">
                  <span className={`${josefin.className} text-[#9b8e78]`}>Category</span>
                  <span className={`${josefin.className} font-semibold text-[#1a1309]`}>{category.name}</span>
                </div>
                {category.variants?.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className={`${josefin.className} text-[#9b8e78]`}>Bed Types</span>
                    <span className={`${josefin.className} font-semibold text-[#1a1309]`}>
                      {[...new Set(category.variants.map((v) => v.bedType).filter(Boolean))].join(", ")}
                    </span>
                  </div>
                )}
                {category.maxAdults && (
                  <div className="flex justify-between items-center">
                    <span className={`${josefin.className} text-[#9b8e78]`}>Max Adults</span>
                    <span className={`${josefin.className} font-semibold text-[#1a1309]`}>{category.maxAdults}</span>
                  </div>
                )}
              </div>
            </div>

            <Link href={`/accommodation/${slug}`}
              className={`${josefin.className} mt-4 flex items-center gap-2 text-[11px] text-[#9b8e78]
                hover:text-[#7A2267] transition-colors duration-200 font-medium uppercase tracking-[0.15em]`}>
              <svg viewBox="0 0 14 10" width="11" height="11" fill="none">
                <path d="M13 5H1M5 1L1 5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back to {property.name}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
