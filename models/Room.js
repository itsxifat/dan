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
  pricePerNight:  { type: Number, default: 0 },    // 0 = inherit from variant/category
  block:          { type: String, default: "" },   // e.g. "Block A", "North Wing"
  row:            { type: String, default: "" },   // e.g. "Row 1", "Corridor A"
  facing:         { type: String, default: "" },   // e.g. "Garden", "Street", "Opposite Block"
  avgRating:      { type: Number, default: 0 },
  reviewCount:    { type: Number, default: 0 },
  createdAt:      { type: Date, default: Date.now },
  updatedAt:      { type: Date, default: Date.now },
});

RoomSchema.index({ property: 1, roomNumber: 1 }, { unique: true });
RoomSchema.index({ property: 1, category: 1 });

export default mongoose.models.Room || mongoose.model("Room", RoomSchema);
