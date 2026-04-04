import mongoose from "mongoose";

const WeddingVenueSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  slug:        { type: String, required: true, unique: true, trim: true },
  capacity:    { type: String, trim: true, default: "" },
  badge:       { type: String, trim: true, default: "" },
  description: { type: String, trim: true, default: "" },
  features:    [{ type: String, trim: true }],
  coverImage:  { type: String, default: "" },
  images:      [{ type: String }],
  isPublished: { type: Boolean, default: true },
  sortOrder:   { type: Number, default: 0 },
  createdAt:   { type: Date, default: Date.now },
});

WeddingVenueSchema.index({ isPublished: 1, sortOrder: 1 });
WeddingVenueSchema.index({ slug: 1 }, { unique: true });

export default mongoose.models.WeddingVenue ||
  mongoose.model("WeddingVenue", WeddingVenueSchema);
