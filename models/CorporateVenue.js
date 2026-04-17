import mongoose from "mongoose";

const CorporateVenueSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  slug:        { type: String, default: "", trim: true },
  capacity:    { type: String, required: true, trim: true },
  badge:       { type: String, default: "", trim: true },
  description: { type: String, default: "" },
  features:    [{ type: String }],
  image:       { type: String, default: "" },
  gallery:     [{ type: String }],
  isPublished: { type: Boolean, default: true },
  sortOrder:   { type: Number, default: 0 },
  createdAt:   { type: Date, default: Date.now },
});

CorporateVenueSchema.index({ isPublished: 1, sortOrder: 1 });
CorporateVenueSchema.index({ slug: 1 });

export default mongoose.models.CorporateVenue ||
  mongoose.model("CorporateVenue", CorporateVenueSchema);
