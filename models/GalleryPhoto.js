import mongoose from "mongoose";

const GalleryPhotoSchema = new mongoose.Schema({
  title:       { type: String, trim: true, default: "" },
  image:       { type: String, required: true },
  altText:     { type: String, trim: true, default: "" },
  category:    { type: String, trim: true, default: "General" },
  imageSize:   { type: String, enum: ["square", "landscape", "portrait", "wide"], default: "square" },
  placement:   { type: String, enum: ["none", "hero", "banner", "wide", "square"], default: "none" },
  isPublished: { type: Boolean, default: true },
  sortOrder:   { type: Number, default: 0 },
  createdAt:   { type: Date, default: Date.now },
});

GalleryPhotoSchema.index({ isPublished: 1, category: 1, placement: 1, sortOrder: 1 });

export default mongoose.models.GalleryPhoto ||
  mongoose.model("GalleryPhoto", GalleryPhotoSchema);
