"use client";

import { useState, useTransition } from "react";
import { updateRoomProfile } from "@/actions/accommodation/roomProfileActions";
import MediaPicker from "@/components/admin/MediaPicker";

const INPUT = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-[#7A2267]/60 transition-all duration-200";
const LABEL = "block text-[10px] uppercase tracking-wider text-white/35 font-semibold mb-1.5";

function SectionHint({ children }) {
  return <p className="text-[10.5px] text-white/25 mt-1">{children}</p>;
}

function OptionalBadge() {
  return (
    <span className="ml-2 text-[9px] normal-case tracking-wide text-white/20 font-normal border border-white/10 px-1.5 py-0.5 rounded-full">
      optional
    </span>
  );
}

export default function RoomDetailEditor({ room }) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState("");

  const [description,    setDescription]    = useState(room.description || "");
  const [coverImage,     setCoverImage]     = useState(room.coverImage  || "");
  const [images,         setImages]         = useState(room.images      || []);
  const [facilities,     setFacilities]     = useState(room.facilities  || []);
  const [videos,         setVideos]         = useState(room.videos      || []);
  const [extraAmenities, setExtraAmenities] = useState(room.extraAmenities || []);

  // Facility editing
  const [newFacName, setNewFacName] = useState("");
  const [newFacIcon, setNewFacIcon] = useState("");

  // Extra amenity editing
  const [newAmenity, setNewAmenity] = useState("");

  // Video editing
  const [newVideo, setNewVideo] = useState("");

  // MediaPicker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerFor,  setPickerFor]  = useState(null); // "cover" | "gallery"

  function openPicker(target) {
    setPickerFor(target);
    setPickerOpen(true);
  }

  function handlePickerSelect(url) {
    if (pickerFor === "cover") setCoverImage(url);
    setPickerOpen(false);
  }

  function handlePickerMultiple(urls) {
    if (pickerFor === "gallery") {
      setImages((prev) => [...prev, ...urls.filter((u) => !prev.includes(u))]);
    }
    setPickerOpen(false);
  }

  function addFacility() {
    if (!newFacName.trim()) return;
    setFacilities((prev) => [...prev, { name: newFacName.trim(), icon: newFacIcon.trim() }]);
    setNewFacName("");
    setNewFacIcon("");
  }
  function removeFacility(i) { setFacilities((prev) => prev.filter((_, j) => j !== i)); }

  function addAmenity() {
    if (!newAmenity.trim()) return;
    setExtraAmenities((prev) => [...prev, newAmenity.trim()]);
    setNewAmenity("");
  }
  function removeAmenity(i) { setExtraAmenities((prev) => prev.filter((_, j) => j !== i)); }

  function addVideo() {
    const url = newVideo.trim();
    if (!url) return;
    if (!url.includes("youtube.com") && !url.includes("youtu.be") && !url.includes("vimeo.com")) {
      return; // simple guard
    }
    setVideos((prev) => [...prev, url]);
    setNewVideo("");
  }
  function removeVideo(i) { setVideos((prev) => prev.filter((_, j) => j !== i)); }
  function removeImage(i) { setImages((prev) => prev.filter((_, j) => j !== i)); }

  function handleSave(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    if (!coverImage) { setError("Cover image is required."); return; }
    startTransition(async () => {
      try {
        await updateRoomProfile({
          roomId: room._id,
          description,
          coverImage,
          images,
          facilities,
          videos,
          extraAmenities,
        });
        setSaved(true);
      } catch (err) {
        setError(err.message || "Failed to save.");
      }
    });
  }

  return (
    <>
      <form onSubmit={handleSave} className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-[12px] px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Description — optional */}
        <div className="bg-white/2 border border-white/6 rounded-2xl p-6">
          <h3 className="text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold mb-1">
            Description <OptionalBadge />
          </h3>
          <SectionHint>A short description shown to guests on the room profile page.</SectionHint>
          <textarea
            className={`${INPUT} resize-none mt-3`}
            rows={5}
            value={description}
            onChange={(e) => { setDescription(e.target.value); setSaved(false); }}
            placeholder="Describe this room — views, vibe, special features…"
          />
        </div>

        {/* Cover Image — MANDATORY */}
        <div className="bg-white/2 border border-white/6 rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold">
              Cover Image
              <span className="ml-2 text-[9px] text-amber-400/70 uppercase tracking-wider border border-amber-400/20 px-1.5 py-0.5 rounded-full">
                mandatory
              </span>
            </h3>
            <SectionHint>
              Recommended: <strong className="text-white/35">1920 × 1080 px</strong> (16:9 landscape) · JPG or PNG · Max 2 MB.
              This is the main image shown in listings and search results.
            </SectionHint>
          </div>
          {coverImage ? (
            <div className="relative w-full max-w-xs">
              <img src={coverImage} alt="Cover" className="w-full h-40 object-cover rounded-xl border border-white/10" />
              <button
                type="button"
                onClick={() => { setCoverImage(""); setSaved(false); }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white/80 hover:text-white"
              >
                <svg viewBox="0 0 10 10" width="10" height="10" fill="none">
                  <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="w-full max-w-xs h-40 rounded-xl border-2 border-dashed border-amber-400/20 flex flex-col items-center justify-center gap-1 bg-amber-400/3">
              <p className="text-[11.5px] text-amber-400/50 font-semibold">No cover image</p>
              <p className="text-[10px] text-white/20">Required before saving</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => openPicker("cover")}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[12px] text-white/60 hover:text-white hover:border-white/20 transition-all duration-150"
          >
            {coverImage ? "Change Cover Image" : "Select Cover Image"}
          </button>
        </div>

        {/* Gallery — MANDATORY */}
        <div className="bg-white/2 border border-white/6 rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold">
              Gallery Photos
              <span className="ml-2 text-[9px] text-amber-400/70 uppercase tracking-wider border border-amber-400/20 px-1.5 py-0.5 rounded-full">
                mandatory
              </span>
            </h3>
            <SectionHint>
              Recommended: <strong className="text-white/35">1920 × 1280 px</strong> (3:2) or <strong className="text-white/35">1920 × 1080 px</strong> (16:9) ·
              JPG or PNG · Max 2 MB per image · Minimum 3 photos recommended.
              Guests can zoom into these images on the room profile page.
            </SectionHint>
          </div>
          {images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-video rounded-lg overflow-hidden group">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { removeImage(i); setSaved(false); }}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg viewBox="0 0 10 10" width="12" height="12" fill="none">
                      <path d="M2 2l6 6M8 2l-6 6" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => openPicker("gallery")}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[12px] text-white/60 hover:text-white hover:border-white/20 transition-all duration-150"
          >
            {images.length > 0 ? `Add More Photos (${images.length} added)` : "Add Gallery Photos"}
          </button>
        </div>

        {/* Facilities — optional */}
        <div className="bg-white/2 border border-white/6 rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold">
              Facilities <OptionalBadge />
            </h3>
            <SectionHint>In-room facilities with emoji icons (e.g. 📺 TV, ❄️ AC, 🛁 Bathtub).</SectionHint>
          </div>
          {facilities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {facilities.map((f, i) => (
                <span key={i} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-[12px] text-white/70">
                  {f.icon && <span>{f.icon}</span>}
                  {f.name}
                  <button type="button" onClick={() => { removeFacility(i); setSaved(false); }}
                    className="ml-1 text-white/30 hover:text-red-400 transition-colors">
                    <svg viewBox="0 0 10 10" width="9" height="9" fill="none">
                      <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              className={`${INPUT} flex-shrink-0 w-14`}
              value={newFacIcon}
              onChange={(e) => setNewFacIcon(e.target.value)}
              placeholder="📺"
              maxLength={4}
              title="Emoji icon"
            />
            <input
              className={`${INPUT} flex-1`}
              value={newFacName}
              onChange={(e) => setNewFacName(e.target.value)}
              placeholder="e.g. WiFi, Smart TV, Air Conditioning"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFacility(); setSaved(false); } }}
            />
            <button type="button" onClick={() => { addFacility(); setSaved(false); }}
              className="px-4 py-2.5 rounded-xl bg-[#7A2267]/80 text-white text-[12px] font-semibold hover:bg-[#7A2267] transition-colors shrink-0">
              Add
            </button>
          </div>
        </div>

        {/* Extra Amenities — optional */}
        <div className="bg-white/2 border border-white/6 rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold">
              Extra Amenities <OptionalBadge />
            </h3>
            <SectionHint>Additional perks included with the room (e.g. Complimentary Breakfast, Bathrobe, Mini Bar).</SectionHint>
          </div>
          {extraAmenities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {extraAmenities.map((a, i) => (
                <span key={i} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-[12px] text-white/70">
                  {a}
                  <button type="button" onClick={() => { removeAmenity(i); setSaved(false); }}
                    className="ml-1 text-white/30 hover:text-red-400 transition-colors">
                    <svg viewBox="0 0 10 10" width="9" height="9" fill="none">
                      <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              className={`${INPUT} flex-1`}
              value={newAmenity}
              onChange={(e) => setNewAmenity(e.target.value)}
              placeholder="e.g. Hairdryer, Bathrobe, Mini Bar, Welcome Fruit"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAmenity(); setSaved(false); } }}
            />
            <button type="button" onClick={() => { addAmenity(); setSaved(false); }}
              className="px-4 py-2.5 rounded-xl bg-[#7A2267]/80 text-white text-[12px] font-semibold hover:bg-[#7A2267] transition-colors shrink-0">
              Add
            </button>
          </div>
        </div>

        {/* Videos — optional */}
        <div className="bg-white/2 border border-white/6 rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold">
              Video Tour <OptionalBadge />
            </h3>
            <SectionHint>
              Paste a <strong className="text-white/35">YouTube</strong> or <strong className="text-white/35">Vimeo</strong> URL.
              Recommended video: <strong className="text-white/35">1920 × 1080 px (Full HD)</strong> or higher · 16:9 ratio · Upload to YouTube first,
              then paste the link here. Videos are optional but recommended for better bookings.
            </SectionHint>
          </div>
          {videos.length > 0 && (
            <div className="space-y-2">
              {videos.map((v, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/3 border border-white/8 rounded-xl px-3 py-2">
                  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" className="shrink-0 text-white/30">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M6 5.5l5 2.5-5 2.5V5.5z" fill="currentColor" />
                  </svg>
                  <p className="flex-1 text-[11.5px] text-white/50 font-mono truncate">{v}</p>
                  <button type="button" onClick={() => { removeVideo(i); setSaved(false); }}
                    className="text-white/25 hover:text-red-400 transition-colors shrink-0">
                    <svg viewBox="0 0 10 10" width="9" height="9" fill="none">
                      <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              className={`${INPUT} flex-1`}
              value={newVideo}
              onChange={(e) => setNewVideo(e.target.value)}
              placeholder="https://youtube.com/watch?v=… or https://youtu.be/…"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addVideo(); setSaved(false); } }}
            />
            <button type="button" onClick={() => { addVideo(); setSaved(false); }}
              className="px-4 py-2.5 rounded-xl bg-[#7A2267]/80 text-white text-[12px] font-semibold hover:bg-[#7A2267] transition-colors shrink-0">
              Add
            </button>
          </div>
          <p className="text-[10px] text-white/20">Only YouTube and Vimeo URLs are accepted.</p>
        </div>

        {/* Save */}
        <div className="flex items-center gap-4 pb-8">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2.5 rounded-xl bg-[#7A2267] text-white text-[12.5px] font-semibold
              hover:bg-[#8e2878] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isPending ? "Saving…" : "Save Room"}
          </button>
          {saved && (
            <span className="text-[12px] text-emerald-400 flex items-center gap-1.5">
              <svg viewBox="0 0 12 12" width="12" height="12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Saved successfully
            </span>
          )}
        </div>
      </form>

      {/* Media Picker */}
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePickerSelect}
        onSelectMultiple={pickerFor === "gallery" ? handlePickerMultiple : undefined}
        multiple={pickerFor === "gallery"}
      />
    </>
  );
}
