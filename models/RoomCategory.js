import mongoose from "mongoose";

const RoomCategorySchema = new mongoose.Schema({
  property:      { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
  name:          { type: String, required: true, trim: true },
  slug:          { type: String, required: true, trim: true },
  description:   { type: String, default: "" },
  coverImage:    { type: String, default: "" },
  images:        [{ type: String }],
  amenities:     [{ type: String }],
  pricePerNight: { type: Number, default: 0 },
  pricePerDay:   { type: Number, default: 0 },  // Day-long package price
  maxAdults:     { type: Number, default: 2 },
  maxChildren:   { type: Number, default: 1 },
  bedType:       {
    type: String,
    enum: ["", "Single", "Double", "Twin", "King", "Queen", "Bunk", "Sofa Bed"],
    default: "",
  },
  // Optional: scoped to a specific building block (empty = property-wide)
  block: { type: String, default: "" },

  // Day-long package support
  supportsDayLong: { type: Boolean, default: false },

  variants: [{
    name:            { type: String, required: true, trim: true },
    bedType:         { type: String, enum: ["Single","Double","Twin","King","Queen","Bunk","Sofa Bed","Triple"], default: "Double" },
    pricePerNight:   { type: Number, required: true, default: 0 },
    supportsDayLong: { type: Boolean, default: false },  // variant-level day-long opt-in
    pricePerDay:     { type: Number, default: 0 },       // variant day-long price
    maxAdults:       { type: Number, default: 2 },
    maxChildren:     { type: Number, default: 0 },
    description:     { type: String, default: "" },
  }],
  size:          { type: String, default: "" },
  floorRange:    { type: String, default: "" },
  isActive:      { type: Boolean, default: true },
  sortOrder:     { type: Number, default: 0 },
  createdAt:     { type: Date, default: Date.now },
  updatedAt:     { type: Date, default: Date.now },
});

RoomCategorySchema.index({ property: 1, slug: 1 }, { unique: true });

// Clear cached model in dev so schema changes are hot-reloaded
if (process.env.NODE_ENV !== "production" && mongoose.models.RoomCategory) {
  delete mongoose.models.RoomCategory;
}

export default mongoose.models.RoomCategory || mongoose.model("RoomCategory", RoomCategorySchema);
