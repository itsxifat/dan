import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema({
  // Child / guest rules
  maxFreeChildAge:    { type: Number, default: 5 },
  maxChildrenPerRoom: { type: Number, default: 2 },
  maxGuestsPerRoom:   { type: Number, default: 4 },
  requireCoupleDoc:   { type: Boolean, default: true },

  // Night stay check-in / check-out times
  checkInTime:        { type: String, default: "14:00" },
  checkOutTime:       { type: String, default: "11:00" },

  // Day-long package check-in / check-out times
  dayLongCheckInTime:  { type: String, default: "09:00" },
  dayLongCheckOutTime: { type: String, default: "18:00" },

  // Financial
  currency:                 { type: String, default: "BDT" },
  taxPercent:               { type: Number, default: 0 },
  advancePaymentPercent:    { type: Number, default: 30 },   // % for partial advance payment
  fullPaymentPercent:       { type: Number, default: 100 },  // always 100, stored for reference

  cancellationPolicy: { type: String, default: "" },

  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
});

export default mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
