import { notFound } from "next/navigation";
import Link from "next/link";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import { getCategoryBySlug } from "@/actions/accommodation/categoryActions";
import CategoryRoomsGrid from "./CategoryRoomsGrid";

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

  const availableRooms = category.rooms?.filter((r) => r.status === "available") ?? [];

  return (
    <main className="min-h-screen bg-[#fcfcfc]">
      {/* Hero */}
      {category.coverImage && (
        <div className="relative h-[38vh] min-h-[240px] overflow-hidden">
          <img src={category.coverImage} alt={category.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-7 max-w-5xl mx-auto">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#c05aae] font-semibold mb-1.5">{property.name}</p>
            <h1 className="text-[26px] sm:text-[34px] font-bold text-white">{category.name}</h1>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[12px] text-neutral-400">
          <Link href="/accommodation" className="hover:text-[#7A2267] transition-colors">Accommodation</Link>
          <span>/</span>
          <Link href={`/accommodation/${slug}`} className="hover:text-[#7A2267] transition-colors">{property.name}</Link>
          <span>/</span>
          <span className="text-neutral-700">{category.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            {/* Details */}
            <div className="bg-white border border-neutral-100 rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-[17px] font-bold text-neutral-800">{category.name}</h2>
                  {category.description && (
                    <p className="text-[13.5px] text-neutral-500 mt-2 leading-relaxed">{category.description}</p>
                  )}
                </div>
                {category.variants?.length > 0 && (() => {
                  const prices = category.variants.map((v) => v.pricePerNight).filter(Boolean);
                  const min = Math.min(...prices);
                  const max = Math.max(...prices);
                  return (
                    <div className="text-right shrink-0">
                      <p className="text-[22px] font-bold text-neutral-800">
                        ৳{min.toLocaleString()}
                        {max !== min && <span className="text-[15px] font-normal text-neutral-500"> – ৳{max.toLocaleString()}</span>}
                      </p>
                      <p className="text-[11px] text-neutral-400">per night</p>
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-neutral-100">
                {[
                  { label: "Bed Type", value: category.variants?.length > 0
                      ? [...new Set(category.variants.map((v) => v.bedType).filter(Boolean))].join(", ")
                      : null },
                  { label: "Room Size",   value: category.size },
                  { label: "Max Adults",  value: category.maxAdults },
                  { label: "Floor Range", value: category.floorRange },
                ].filter((f) => f.value).map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[9.5px] uppercase tracking-wider text-neutral-400 font-semibold mb-1">{label}</p>
                    <p className="text-[13px] text-neutral-700">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Variants pricing table */}
            {category.variants?.length > 0 && (
              <div>
                <h3 className="text-[15px] font-bold text-neutral-800 mb-3">Room Types &amp; Pricing</h3>
                <div className="space-y-2">
                  {category.variants.map((v) => (
                    <div key={v._id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                      <div>
                        <p className="text-[13px] font-semibold text-neutral-800">{v.name}</p>
                        <div className="flex gap-2 mt-0.5">
                          <span className="text-[10.5px] text-neutral-500">{v.bedType} bed</span>
                          {v.maxAdults && <span className="text-[10.5px] text-neutral-500">· {v.maxAdults} adults</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[15px] font-bold text-neutral-800">৳{v.pricePerNight.toLocaleString()}</p>
                        <p className="text-[10px] text-neutral-400">per night</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Amenities */}
            {category.amenities?.length > 0 && (
              <div>
                <h3 className="text-[15px] font-bold text-neutral-800 mb-3">Room Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {category.amenities.map((a) => (
                    <span key={a} className="text-[11.5px] text-neutral-600 bg-neutral-100 px-3 py-1.5 rounded-full">{a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Room Availability */}
            {category.rooms?.length > 0 ? (
              <CategoryRoomsGrid rooms={category.rooms} category={category} />
            ) : (
              <p className="text-[13px] text-neutral-400">No rooms configured yet.</p>
            )}
          </div>

          {/* Sidebar CTA */}
          <div>
            <div className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-sm space-y-4 sticky top-24">
              <div className="text-center">
                {category.variants?.length > 0 && (() => {
                  const prices = category.variants.map((v) => v.pricePerNight).filter(Boolean);
                  const min = Math.min(...prices);
                  const max = Math.max(...prices);
                  return (
                    <p className="text-[28px] font-bold text-neutral-800">
                      ৳{min.toLocaleString()}
                      {max !== min && <span className="text-[13px] font-normal text-neutral-400"> – ৳{max.toLocaleString()}</span>}
                      <span className="text-[13px] font-normal text-neutral-400">/night</span>
                    </p>
                  );
                })()}
                {availableRooms.length > 0 ? (
                  <p className="text-[12px] text-emerald-600 mt-1">{availableRooms.length} room{availableRooms.length !== 1 ? "s" : ""} available</p>
                ) : (
                  <p className="text-[12px] text-red-400 mt-1">No rooms available</p>
                )}
              </div>

              {availableRooms.length > 0 && (
                <Link
                  href={`/booking?property=${property._id}&category=${category._id}`}
                  className="block w-full text-center py-3 rounded-xl bg-[#7A2267] text-white text-[13.5px]
                    font-semibold hover:bg-[#8e2878] transition-colors duration-200"
                >
                  Book This Room
                </Link>
              )}

              <div className="pt-2 space-y-2 text-[12px] text-neutral-500">
                <div className="flex justify-between">
                  <span>Category</span><span className="font-medium text-neutral-700">{category.name}</span>
                </div>
                {category.variants?.length > 0 && (
                  <div className="flex justify-between">
                    <span>Bed Types</span>
                    <span className="font-medium text-neutral-700">
                      {[...new Set(category.variants.map((v) => v.bedType).filter(Boolean))].join(", ")}
                    </span>
                  </div>
                )}
                {category.maxAdults && (
                  <div className="flex justify-between">
                    <span>Max Adults</span><span className="font-medium text-neutral-700">{category.maxAdults}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
