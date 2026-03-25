import mongoose from "mongoose";

const DayLongPackageSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  price:       { type: Number, required: true, default: 0 },
  includes:    [{ type: String }],   // e.g. ["Entry", "Swimming Pool", "Lunch"]
  icon:        { type: String, default: "" },
  isActive:    { type: Boolean, default: true },
  sortOrder:   { type: Number, default: 0 },
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now },
});

export default mongoose.models.DayLongPackage || mongoose.model("DayLongPackage", DayLongPackageSchema);
