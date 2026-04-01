import mongoose from "mongoose";

const DayLongPackageSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  description:  { type: String, default: "" },
  price:        { type: Number, required: true, default: 0 },
  image:        { type: String, default: "" },
  // "entry" = mandatory entry fee (user picks exactly one)
  // "addon"  = optional add-on (swimming pool, lunch, etc.)
  type:         { type: String, enum: ["entry", "addon"], default: "addon" },
  // Optional discount on the booking total when this item is selected
  discountType:  { type: String, enum: ["none", "percent", "fixed"], default: "none" },
  discountValue: { type: Number, default: 0 },
  isActive:  { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

if (process.env.NODE_ENV !== "production" && mongoose.models.DayLongPackage) {
  delete mongoose.models.DayLongPackage;
}

export default mongoose.models.DayLongPackage || mongoose.model("DayLongPackage", DayLongPackageSchema);
