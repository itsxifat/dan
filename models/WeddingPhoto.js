import mongoose from "mongoose";

const WeddingPhotoSchema = new mongoose.Schema({
  title:       { type: String, trim: true, default: "" },
  image:       { type: String, required: true },
  altText:     { type: String, trim: true, default: "" },
  category:    {
    type: String,
    enum: ["Ceremony", "Reception", "Holud · Mehndi", "Venue", "Décor", "General"],
    default: "General",
  },
  span:        { type: String, enum: ["none", "row", "col"], default: "none" },
  isPublished: { type: Boolean, default: true },
  sortOrder:   { type: Number, default: 0 },
  createdAt:   { type: Date, default: Date.now },
});

WeddingPhotoSchema.index({ isPublished: 1, category: 1, sortOrder: 1 });

export default mongoose.models.WeddingPhoto ||
  mongoose.model("WeddingPhoto", WeddingPhotoSchema);
