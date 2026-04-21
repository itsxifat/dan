import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const GuestSchema = new mongoose.Schema(
  {
    name:   { type: String, required: true, maxlength: 120 },
    age:    { type: Number, min: 0, max: 120 },
    gender: { type: String, enum: ["male", "female", "other"] },
    type:   { type: String, enum: ["adult", "child"], default: "adult" },
  },
  { _id: false }
);

const PaymentRecordSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ["cash", "bkash", "nagad", "rocket", "bank_transfer", "card", "other"],
      default: "cash",
    },
    note:            { type: String, maxlength: 500 },
    receivedAt:      { type: Date, default: Date.now },
    receivedBy:      { type: ObjectId, ref: "User" },
    receivedByName:  { type: String, maxlength: 120 },
  },
  { _id: true }
);

const IssueSchema = new mongoose.Schema(
  {
    description:      { type: String, required: true, maxlength: 2000 },
    priority:         { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
    status:           { type: String, enum: ["open", "in_progress", "resolved"], default: "open" },
    reportedAt:       { type: Date, default: Date.now },
    reportedBy:       { type: ObjectId, ref: "User" },
    reportedByName:   { type: String, maxlength: 120 },
    resolvedAt:       { type: Date },
    resolvedBy:       { type: ObjectId, ref: "User" },
    resolvedByName:   { type: String, maxlength: 120 },
    resolution:       { type: String, maxlength: 2000 },
  },
  { _id: true }
);

const OfflineBookingSchema = new mongoose.Schema(
  {
    referenceNumber: { type: String, unique: true, maxlength: 30 },

    property: { type: ObjectId, ref: "Property",     required: true },
    room:     { type: ObjectId, ref: "Room",         required: true },
    category: { type: ObjectId, ref: "RoomCategory" },

    checkIn:  { type: Date, required: true },
    checkOut: { type: Date, required: true },
    nights:   { type: Number, required: true, min: 0 },

    primaryGuest: {
      name:        { type: String, required: true, maxlength: 120 },
      phone:       { type: String, maxlength: 30 },
      whatsapp:    { type: String, maxlength: 30 },
      nidNumber:   { type: String, maxlength: 50 },
      nidUrl:      { type: String, maxlength: 2048 },
      gender:      { type: String, enum: ["male", "female", "other"] },
      age:         { type: Number, min: 0, max: 120 },
      address:     { type: String, maxlength: 500 },
      nationality: { type: String, default: "Bangladeshi", maxlength: 60 },
    },

    allGuests:   { type: [GuestSchema], default: [] },
    totalGuests: { type: Number, default: 1, min: 0 },

    status: {
      type: String,
      enum: ["reserved", "confirmed", "checked_in", "checked_out", "cancelled", "no_show"],
      default: "confirmed",
    },

    pricePerNight:  { type: Number, required: true, min: 0 },
    totalAmount:    { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0,     min: 0 },
    finalAmount:    { type: Number, required: true, min: 0 },

    payments:        { type: [PaymentRecordSchema], default: [] },
    paidAmount:      { type: Number, default: 0, min: 0 },
    remainingAmount: { type: Number, default: 0, min: 0 },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partial", "paid", "refunded"],
      default: "unpaid",
    },

    actualCheckIn:  { type: Date },
    actualCheckOut: { type: Date },

    specialRequests: { type: String, maxlength: 2000 },
    adminNotes:      { type: String, maxlength: 5000 },
    internalNotes:   { type: String, maxlength: 5000 },

    issues: { type: [IssueSchema], default: [] },

    hasConflict:       { type: Boolean, default: false },
    conflictBookingId: { type: ObjectId, ref: "Booking" },
    conflictNote:      { type: String, maxlength: 500 },

    createdBy:          { type: ObjectId, ref: "User" },
    createdByName:      { type: String, maxlength: 120 },
    updatedBy:          { type: ObjectId, ref: "User" },
    cancelledBy:        { type: ObjectId, ref: "User" },
    cancellationReason: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// ── Conflict detection ────────────────────────────────────────────────────────
// Core query: "is this room occupied for these dates by an active booking?"
// Adding status to the compound keeps cancelled/no_show rows out of the scan.
OfflineBookingSchema.index({ room: 1, status: 1, checkIn: 1, checkOut: 1 });

// Simpler date-range scan used in the categoryActions "freeFrom" lookup
OfflineBookingSchema.index({ room: 1, checkIn: 1, checkOut: 1 });

// ── Admin listings ────────────────────────────────────────────────────────────
OfflineBookingSchema.index({ property: 1, status: 1 });
OfflineBookingSchema.index({ property: 1, createdAt: -1 });
OfflineBookingSchema.index({ status: 1, createdAt: -1 });
OfflineBookingSchema.index({ createdAt: -1 });

// ── Guest lookups ─────────────────────────────────────────────────────────────
OfflineBookingSchema.index({ "primaryGuest.phone": 1 });

// ── Date-range queries (dashboard calendar) ───────────────────────────────────
OfflineBookingSchema.index({ checkIn: 1, checkOut: 1 });

// ─── Pre-save hook — auto reference + payment status recalculation ────────────
OfflineBookingSchema.pre("save", function (next) {
  if (!this.referenceNumber) {
    this.referenceNumber = `OB-${Date.now()}`;
  }

  if (this.isModified("payments")) {
    this.paidAmount = this.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  }

  this.remainingAmount = Math.max(0, this.finalAmount - this.paidAmount);

  if (this.paidAmount >= this.finalAmount) {
    this.paymentStatus = "paid";
  } else if (this.paidAmount > 0) {
    this.paymentStatus = "partial";
  } else {
    this.paymentStatus = "unpaid";
  }

  next();
});

// ─── Model ────────────────────────────────────────────────────────────────────
export default mongoose.models.OfflineBooking ||
  mongoose.model("OfflineBooking", OfflineBookingSchema);
