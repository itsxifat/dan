import { notFound } from "next/navigation";
import Link from "next/link";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import { getCategoryBySlug } from "@/actions/accommodation/categoryActions";

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

const ROOM_STATUS_DOT = {
  available:   "bg-emerald-500",
  occupied:    "bg-amber-400",
  maintenance: "bg-orange-400",
  blocked:     "bg-red-400",
};

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
                <div className="text-right shrink-0">
                  <p className="text-[22px] font-bold text-neutral-800">
                    ৳{category.pricePerNight?.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-neutral-400">per night</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-neutral-100">
                {[
                  { label: "Bed Type",    value: category.bedType },
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

            {/* Room availability list */}
            <div>
              <h3 className="text-[15px] font-bold text-neutral-800 mb-4">
                Room Availability
                <span className="ml-2 text-[12px] font-normal text-neutral-400">
                  {availableRooms.length} of {category.rooms?.length ?? 0} available
                </span>
              </h3>
              {category.rooms?.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {category.rooms.map((room) => (
                    <div
                      key={room._id}
                      className={`p-3 rounded-xl border text-center transition-all duration-200
                        ${room.status === "available"
                          ? "bg-white border-neutral-200 hover:border-[#7A2267]/30 hover:shadow-sm"
                          : "bg-neutral-50 border-neutral-100 opacity-60"
                        }`}
                    >
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${ROOM_STATUS_DOT[room.status]}`} />
                        <span className="text-[13px] font-semibold text-neutral-700 font-mono">{room.roomNumber}</span>
                      </div>
                      <p className="text-[10.5px] text-neutral-400">Floor {room.floor}</p>
                      <p className={`text-[10px] uppercase tracking-wide mt-0.5 font-medium
                        ${room.status === "available" ? "text-emerald-600" : "text-neutral-400"}`}>
                        {room.status}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-neutral-400">No rooms configured yet.</p>
              )}
            </div>
          </div>

          {/* Sidebar CTA */}
          <div>
            <div className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-sm space-y-4 sticky top-24">
              <div className="text-center">
                <p className="text-[28px] font-bold text-neutral-800">
                  ৳{category.pricePerNight?.toLocaleString()}
                  <span className="text-[13px] font-normal text-neutral-400">/night</span>
                </p>
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
                <div className="flex justify-between">
                  <span>Bed Type</span><span className="font-medium text-neutral-700">{category.bedType}</span>
                </div>
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
