import mongoose from "mongoose";

const GalleryCategorySchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.GalleryCategory ||
  mongoose.model("GalleryCategory", GalleryCategorySchema);
