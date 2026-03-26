import mongoose from "mongoose";

const MenuItemSchema = new mongoose.Schema({
  venue:       { type: String, required: true, enum: ["cafe", "restaurant"] },
  category:    { type: String, required: true, trim: true }, // e.g. "Starters", "Mains", "Beverages"
  name:        { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: "" },
  price:       { type: Number, required: true, min: 0 },
  image:       { type: String, default: "" },
  isAvailable: { type: Boolean, default: true },
  isPopular:   { type: Boolean, default: false },
  isVeg:       { type: Boolean, default: false },
  sortOrder:   { type: Number, default: 0 },
  createdAt:   { type: Date, default: Date.now },
});

MenuItemSchema.index({ venue: 1, category: 1, sortOrder: 1 });
MenuItemSchema.index({ venue: 1, isAvailable: 1 });

export default mongoose.models.MenuItem ||
  mongoose.model("MenuItem", MenuItemSchema);
