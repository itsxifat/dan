import mongoose from "mongoose";

const RoomCategorySchema = new mongoose.Schema({
  property:      { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
  name:          { type: String, required: true, trim: true },
  slug:          { type: String, required: true, trim: true },
  description:   { type: String, default: "" },
  coverImage:    { type: String, default: "" },
  images:        [{ type: String }],
  amenities:     [{ type: String }],
  pricePerNight: { type: Number, required: true, default: 0 },
  maxAdults:     { type: Number, default: 2 },
  maxChildren:   { type: Number, default: 1 },
  bedType:       {
    type: String,
    enum: ["Single", "Double", "Twin", "King", "Queen", "Bunk", "Sofa Bed"],
    default: "Double",
  },
  size:          { type: String, default: "" },   // e.g. "350 sq ft"
  floorRange:    { type: String, default: "" },   // e.g. "3rd–5th Floor"
  isActive:      { type: Boolean, default: true },
  sortOrder:     { type: Number, default: 0 },
  createdAt:     { type: Date, default: Date.now },
  updatedAt:     { type: Date, default: Date.now },
});

RoomCategorySchema.index({ property: 1, slug: 1 }, { unique: true });

// Delete stale cached model in dev so schema changes are picked up on hot-reload
if (process.env.NODE_ENV !== "production" && mongoose.models.RoomCategory) {
  delete mongoose.models.RoomCategory;
}

export default mongoose.models.RoomCategory || mongoose.model("RoomCategory", RoomCategorySchema);
