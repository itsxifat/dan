import mongoose from "mongoose";

const GuestSchema = new mongoose.Schema(
  {
    name:   { type: String, required: true },
    age:    { type: Number },
    gender: { type: String, enum: ["male", "female", "other"] },
    type:   { type: String, enum: ["adult", "child"], default: "adult" },
  },
  { _id: false }
);

const PaymentRecordSchema = new mongoose.Schema(
  {
    amount:     { type: Number, required: true },
    method:     {
      type: String,
      enum: ["cash", "bkash", "nagad", "rocket", "bank_transfer", "card", "other"],
      default: "cash",
    },
    note:       { type: String },
    receivedAt: { type: Date, default: Date.now },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    receivedByName: { type: String }, // cached
  },
  { _id: true }
);

const IssueSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    priority:    { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
    status:      { type: String, enum: ["open", "in_progress", "resolved"], default: "open" },
    reportedAt:  { type: Date, default: Date.now },
    reportedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reportedByName: { type: String },
    resolvedAt:  { type: Date },
    resolvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedByName: { type: String },
    resolution:  { type: String },
  },
  { _id: true }
);

const OfflineBookingSchema = new mongoose.Schema(
  {
    // Unique human-readable reference
    referenceNumber: { type: String, unique: true }, // OB-{timestamp}

    // Location
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property",     required: true },
    room:     { type: mongoose.Schema.Types.ObjectId, ref: "Room",         required: true, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "RoomCategory" },

    // Stay dates
    checkIn:  { type: Date, required: true },
    checkOut: { type: Date, required: true },
    nights:   { type: Number, required: true },

    // Primary guest
    primaryGuest: {
      name:        { type: String, required: true },
      phone:       { type: String },
      whatsapp:    { type: String },
      nidNumber:   { type: String },
      nidUrl:      { type: String },
      gender:      { type: String, enum: ["male", "female", "other"] },
      age:         { type: Number },
      address:     { type: String },
      nationality: { type: String, default: "Bangladeshi" },
    },

    // All guests in the room
    allGuests:   [GuestSchema],
    totalGuests: { type: Number, default: 1 },

    // Booking lifecycle
    status: {
      type: String,
      enum: ["reserved", "confirmed", "checked_in", "checked_out", "cancelled", "no_show"],
      default: "confirmed",
    },

    // Pricing
    pricePerNight:  { type: Number, required: true },
    totalAmount:    { type: Number, required: true }, // nights × pricePerNight
    discountAmount: { type: Number, default: 0 },
    finalAmount:    { type: Number, required: true }, // totalAmount − discount

    // Payments
    payments:      [PaymentRecordSchema],
    paidAmount:    { type: Number, default: 0 },
    remainingAmount:{ type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partial", "paid", "refunded"],
      default: "unpaid",
    },

    // Actual arrival / departure timestamps
    actualCheckIn:  { type: Date },
    actualCheckOut: { type: Date },

    // Notes
    specialRequests: { type: String },
    adminNotes:      { type: String },
    internalNotes:   { type: String }, // staff-only

    // Issues / maintenance reports linked to this stay
    issues: [IssueSchema],

    // Conflict detection
    hasConflict:      { type: Boolean, default: false },
    conflictBookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    conflictNote:      { type: String },

    // Audit
    createdBy:          { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdByName:      { type: String },
    updatedBy:          { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    cancelledBy:        { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    cancellationReason: { type: String },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
OfflineBookingSchema.index({ room: 1, checkIn: 1, checkOut: 1 });
OfflineBookingSchema.index({ property: 1, status: 1 });
OfflineBookingSchema.index({ checkIn: 1, checkOut: 1 });
OfflineBookingSchema.index({ "primaryGuest.phone": 1 });
OfflineBookingSchema.index({ status: 1 });

// ── Pre-save: auto reference + sync payment status ───────────────────────────
OfflineBookingSchema.pre("save", function (next) {
  if (!this.referenceNumber) {
    this.referenceNumber = `OB-${Date.now()}`;
  }

  // Recalculate paid amount from payments array
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

export default mongoose.models.OfflineBooking ||
  mongoose.model("OfflineBooking", OfflineBookingSchema);
