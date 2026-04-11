import mongoose from "mongoose";

const AmenitySchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  slug:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  iconType:  { type: String, enum: ["library", "upload"], default: "library" },
  iconValue: { type: String, default: "" }, // library key OR uploaded image URL
  category:  { type: String, default: "General", trim: true },
  isActive:  { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

AmenitySchema.index({ isActive: 1, sortOrder: 1 });

export default mongoose.models.Amenity || mongoose.model("Amenity", AmenitySchema);
