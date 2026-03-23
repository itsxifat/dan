import mongoose from "mongoose";

const PropertySchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  slug:          { type: String, required: true, unique: true, lowercase: true, trim: true },
  type:          { type: String, enum: ["building", "cottage"], required: true },
  tagline:       { type: String, trim: true, default: "" },
  description:   { type: String, default: "" },
  coverImage:    { type: String, default: "" },
  images:        [{ type: String }],
  amenities:     [{ type: String }],
  location:      { type: String, trim: true, default: "" },
  mapEmbedUrl:   { type: String, default: "" },

  // Building-specific
  totalFloors:   { type: Number, default: 0 },

  // Cottage-specific
  maxGuests:     { type: Number, default: 2 },
  pricePerNight: { type: Number, default: 0 },

  isActive:      { type: Boolean, default: true },
  isFeatured:    { type: Boolean, default: false },
  sortOrder:     { type: Number, default: 0 },

  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  createdAt:     { type: Date, default: Date.now },
  updatedAt:     { type: Date, default: Date.now },
});

PropertySchema.index({ type: 1, isActive: 1 });

export default mongoose.models.Property || mongoose.model("Property", PropertySchema);
