"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProperty, updateProperty } from "@/actions/accommodation/propertyActions";
import ImageUpload from "@/components/ui/ImageUpload";
import MultiImageUpload from "@/components/ui/MultiImageUpload";

const COMMON_AMENITIES = [
  "WiFi", "Air Conditioning", "Hot Water", "TV", "Parking",
  "Room Service", "Laundry", "Generator", "Security", "CCTV",
  "Swimming Pool", "Garden", "Restaurant", "Bar", "Gym",
  "Balcony", "River View", "Mountain View", "Pet Friendly", "Non-smoking",
];

const INPUT = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-[#7A2267]/60 focus:bg-white/[0.06] transition-all duration-200";
const LABEL = "block text-[10px] uppercase tracking-wider text-white/35 font-semibold mb-1.5";

export default function PropertyForm({ property = null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const isEdit = !!property;

  const [form, setForm] = useState({
    name:         property?.name         ?? "",
    type:         property?.type         ?? "building",
    tagline:      property?.tagline      ?? "",
    description:  property?.description  ?? "",
    location:     property?.location     ?? "",
    mapEmbedUrl:  property?.mapEmbedUrl  ?? "",
    coverImage:   property?.coverImage   ?? "",
    images:       property?.images ?? [],
    amenities:    property?.amenities    ?? [],
    totalFloors:  property?.totalFloors  ?? 5,
    maxGuests:    property?.maxGuests    ?? 4,
    pricePerNight:property?.pricePerNight?? 0,
    isActive:     property?.isActive     ?? true,
    isFeatured:   property?.isFeatured   ?? false,
    sortOrder:    property?.sortOrder    ?? 0,
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setNum = (key) => (e) => setForm((f) => ({ ...f, [key]: Number(e.target.value) }));
  const setBool = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.checked }));

  function toggleAmenity(a) {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a)
        ? f.amenities.filter((x) => x !== a)
        : [...f.amenities, a],
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const data = {
      ...form,
      images: form.images,
      totalFloors:   Number(form.totalFloors),
      maxGuests:     Number(form.maxGuests),
      pricePerNight: Number(form.pricePerNight),
      sortOrder:     Number(form.sortOrder),
    };

    startTransition(async () => {
      try {
        if (isEdit) {
          await updateProperty(property._id, data);
          router.push(`/admin/accommodation/${property._id}`);
        } else {
          const result = await createProperty(data);
          router.push(`/admin/accommodation/${result.id}`);
        }
      } catch (err) {
        setError(err.message || "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      {error && (
        <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-[12px] px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Basic info */}
      <div className="bg-white/2 border border-white/6 rounded-2xl p-6 space-y-5">
        <h3 className="text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold">Basic Info</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className={LABEL}>Property Name *</label>
            <input className={INPUT} value={form.name} onChange={set("name")} placeholder="e.g. The Amber Tower" required />
          </div>

          {/* Type */}
          <div>
            <label className={LABEL}>Type *</label>
            <div className="flex gap-3">
              {["building", "cottage"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={`flex-1 py-2.5 rounded-xl text-[12px] font-medium border capitalize transition-all duration-200
                    ${form.type === t
                      ? "bg-[#7A2267]/25 border-[#7A2267]/60 text-[#c05aae]"
                      : "border-white/[0.08] text-white/30 hover:text-white/55 hover:border-white/15"
                    }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={LABEL}>Sort Order</label>
            <input type="number" className={INPUT} value={form.sortOrder} onChange={setNum("sortOrder")} min="0" />
          </div>

          <div className="sm:col-span-2">
            <label className={LABEL}>Tagline</label>
            <input className={INPUT} value={form.tagline} onChange={set("tagline")} placeholder="A short, catchy tagline" />
          </div>

          <div className="sm:col-span-2">
            <label className={LABEL}>Description</label>
            <textarea
              className={`${INPUT} resize-none`}
              rows={4}
              value={form.description}
              onChange={set("description")}
              placeholder="Describe this property..."
            />
          </div>

          <div>
            <label className={LABEL}>Location</label>
            <input className={INPUT} value={form.location} onChange={set("location")} placeholder="e.g. Cox's Bazar, Bangladesh" />
          </div>

          {form.type === "building" && (
            <div>
              <label className={LABEL}>Total Floors</label>
              <input type="number" className={INPUT} value={form.totalFloors} onChange={setNum("totalFloors")} min="1" />
            </div>
          )}

          {form.type === "cottage" && (
            <>
              <div>
                <label className={LABEL}>Max Guests</label>
                <input type="number" className={INPUT} value={form.maxGuests} onChange={setNum("maxGuests")} min="1" />
              </div>
              <div>
                <label className={LABEL}>Price / Night (BDT)</label>
                <input type="number" className={INPUT} value={form.pricePerNight} onChange={setNum("pricePerNight")} min="0" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Images */}
      <div className="bg-white/2 border border-white/6 rounded-2xl p-6 space-y-5">
        <h3 className="text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold">Images</h3>

        <div>
          <label className={LABEL}>Cover Image *</label>
          <ImageUpload
            dark
            value={form.coverImage}
            onChange={(url) => setForm((f) => ({ ...f, coverImage: url }))}
          />
        </div>

        <div>
          <label className={LABEL}>Gallery Images</label>
          <MultiImageUpload
            dark
            values={form.images}
            onChange={(urls) => setForm((f) => ({ ...f, images: urls }))}
          />
        </div>

        <div>
          <label className={LABEL}>Google Maps Embed URL</label>
          <input className={INPUT} value={form.mapEmbedUrl} onChange={set("mapEmbedUrl")} placeholder="https://www.google.com/maps/embed?pb=..." />
        </div>
      </div>

      {/* Amenities */}
      <div className="bg-white/2 border border-white/6 rounded-2xl p-6 space-y-4">
        <h3 className="text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold">Amenities</h3>
        <div className="flex flex-wrap gap-2">
          {COMMON_AMENITIES.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => toggleAmenity(a)}
              className={`text-[11px] px-3 py-1.5 rounded-full border transition-all duration-200
                ${form.amenities.includes(a)
                  ? "bg-[#7A2267]/20 border-[#7A2267]/50 text-[#c05aae]"
                  : "border-white/[0.08] text-white/30 hover:text-white/55 hover:border-white/15"
                }`}
            >
              {a}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-white/20">Selected: {form.amenities.length > 0 ? form.amenities.join(", ") : "None"}</p>
      </div>

      {/* Flags */}
      <div className="bg-white/2 border border-white/6 rounded-2xl p-6 space-y-4">
        <h3 className="text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold">Visibility</h3>
        <div className="flex flex-col gap-3">
          {[
            { key: "isActive",   label: "Active",   sub: "Visible to guests on the site" },
            { key: "isFeatured", label: "Featured", sub: "Shown in the featured section on the homepage" },
          ].map(({ key, label, sub }) => (
            <label key={key} className="flex items-center gap-4 cursor-pointer group">
              <div className="relative shrink-0">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={form[key]}
                  onChange={setBool(key)}
                />
                <div className={`w-10 h-5 rounded-full transition-colors duration-200
                  ${form[key] ? "bg-[#7A2267]" : "bg-white/10"}`}
                />
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200
                  ${form[key] ? "translate-x-5" : "translate-x-0"}`}
                />
              </div>
              <div>
                <p className="text-[12px] font-medium text-white/70">{label}</p>
                <p className="text-[10px] text-white/25">{sub}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pb-8">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 rounded-xl bg-[#7A2267] text-white text-[12.5px] font-semibold
            hover:bg-[#8e2878] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Property"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 rounded-xl border border-white/[0.08] text-white/35
            text-[12.5px] hover:text-white/65 hover:border-white/15 transition-all duration-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
