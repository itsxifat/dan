import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const RoomSchema = new mongoose.Schema({
  property: { type: ObjectId, ref: "Property",     required: true },
  category: { type: ObjectId, ref: "RoomCategory", required: true },

  roomNumber: { type: String, required: true, trim: true, maxlength: 20 },
  floor:      { type: Number, required: true, min: 0, max: 200 },

  status: {
    type: String,
    enum: ["available", "occupied", "maintenance", "blocked"],
    default: "available",
  },

  description:    { type: String, default: "", maxlength: 2000 },
  notes:          { type: String, default: "", maxlength: 2000 },
  facilities:     { type: [{ name: String, icon: String }], default: [] },
  videos:         { type: [String], default: [] },
  extraAmenities: { type: [String], default: [] },

  variantId: { type: ObjectId, default: null },

  // 0 = inherit from variant/category
  pricePerNight: { type: Number, default: 0, min: 0 },
  pricePerDay:   { type: Number, default: 0, min: 0 },

  // null = inherit from category; true/false = explicit override
  dayLongSupported: { type: Boolean, default: null },

  block:       { type: String, default: "", maxlength: 50 },
  row:         { type: String, default: "", maxlength: 20 },
  facing:      { type: String, default: "", maxlength: 50 },
  avgRating:   { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0, min: 0 },

  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date, default: Date.now },
});

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Uniqueness: one roomNumber per property
RoomSchema.index({ property: 1, roomNumber: 1 }, { unique: true });

// Category listing (getCategoriesByProperty room stats, getAvailableRooms)
RoomSchema.index({ property: 1, category: 1 });

// Availability listing: "show me available rooms in this category"
// status is last because it's low cardinality — still eliminates non-available docs
// at index scan time rather than in-memory
RoomSchema.index({ property: 1, category: 1, status: 1 });

// Room status board: all rooms for a property grouped by status
RoomSchema.index({ property: 1, status: 1 });

// Status-only queries (e.g., "how many rooms are under maintenance?")
RoomSchema.index({ status: 1 });

// ─── Model ────────────────────────────────────────────────────────────────────
export default mongoose.models.Room || mongoose.model("Room", RoomSchema);
