import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema({
  maxFreeChildAge:    { type: Number, default: 5 },    // children ≤ this age are free
  maxChildrenPerRoom: { type: Number, default: 2 },
  maxGuestsPerRoom:   { type: Number, default: 4 },
  requireCoupleDoc:   { type: Boolean, default: true },
  checkInTime:        { type: String, default: "14:00" },
  checkOutTime:       { type: String, default: "11:00" },
  currency:           { type: String, default: "BDT" },
  taxPercent:         { type: Number, default: 0 },
  cancellationPolicy: { type: String, default: "" },
  updatedAt:          { type: Date, default: Date.now },
  updatedBy:          { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
});

export default mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
