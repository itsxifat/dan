import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
  property:    { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
  category:    { type: mongoose.Schema.Types.ObjectId, ref: "RoomCategory", required: true },
  roomNumber:  { type: String, required: true, trim: true },
  floor:       { type: Number, required: true },
  status:      {
    type: String,
    enum: ["available", "occupied", "maintenance", "blocked"],
    default: "available",
  },
  coverImage:     { type: String, default: "" },
  images:         { type: [String], default: [] },
  description:    { type: String, default: "" },
  notes:          { type: String, default: "" },
  facilities:     { type: [{ name: String, icon: String }], default: [] },
  videos:         { type: [String], default: [] },
  extraAmenities: { type: [String], default: [] },
  variantId:      { type: mongoose.Schema.Types.ObjectId, default: null },

  // Price overrides — 0 = inherit from variant/category
  pricePerNight:  { type: Number, default: 0 },
  pricePerDay:    { type: Number, default: 0 },  // Day-long override price

  // Day-long exception: null = inherit from category, true/false = explicit override
  dayLongSupported: { type: Boolean, default: null },

  block:          { type: String, default: "" },
  row:            { type: String, default: "" },
  facing:         { type: String, default: "" },
  avgRating:      { type: Number, default: 0 },
  reviewCount:    { type: Number, default: 0 },
  createdAt:      { type: Date, default: Date.now },
  updatedAt:      { type: Date, default: Date.now },
});

RoomSchema.index({ property: 1, roomNumber: 1 }, { unique: true });
RoomSchema.index({ property: 1, category: 1 });

export default mongoose.models.Room || mongoose.model("Room", RoomSchema);
