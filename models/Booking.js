import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const GuestSchema = new mongoose.Schema({
  name:   { type: String, required: true, trim: true, maxlength: 120 },
  age:    { type: Number, required: true, min: 0, max: 120 },
  gender: { type: String, enum: ["male", "female", "other"], required: true },
  type:   { type: String, enum: ["adult", "child"], required: true },
}, { _id: false });

const RoomBookingSchema = new mongoose.Schema({
  room:              { type: ObjectId, ref: "Room",         required: true },
  category:          { type: ObjectId, ref: "RoomCategory", default: null },
  pricePerNight:     { type: Number, required: true, min: 0 },
  pricePerDay:       { type: Number, default: 0,    min: 0 },
  guests:            { type: [GuestSchema], default: [] },
  isCoupleRoom:      { type: Boolean, default: false },
  coupleDocumentUrl: { type: String, default: "", maxlength: 2048 },
  coupleDocMethod:   { type: String, default: "", maxlength: 50 },
}, { _id: false });

const BookingSchema = new mongoose.Schema({
  bookingNumber: { type: String, required: true, unique: true, maxlength: 20 },

  bookingMode: {
    type: String,
    enum: ["night_stay", "day_long"],
    required: true,
    default: "night_stay",
  },

  property:    { type: ObjectId, ref: "Property", default: null },
  bookingType: { type: String, enum: ["room", "cottage", null], default: null },

  roomBookings: { type: [RoomBookingSchema], default: [] },

  // Cottage / legacy single-room path
  category: { type: ObjectId, ref: "RoomCategory", default: null },
  room:      { type: ObjectId, ref: "Room",         default: null },

  dayLongPackage:  { type: ObjectId, ref: "DayLongPackage", default: null },
  dayLongAddons:   [{ type: ObjectId, ref: "DayLongPackage" }],
  dayLongDiscount: { type: Number, default: 0, min: 0 },

  checkIn:  { type: Date, required: true },
  checkOut: { type: Date, required: true },
  nights:   { type: Number, required: true, min: 0 },

  primaryGuest: {
    name:     { type: String, required: true, trim: true, maxlength: 120 },
    email:    { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    phone:    { type: String, required: true, trim: true, maxlength: 30 },
    whatsapp: { type: String, default: "", maxlength: 30 },
    gender:   { type: String, enum: ["male", "female", "other"], required: true },
    age:      { type: Number, required: true, min: 0, max: 120 },
  },

  allGuests:   { type: [GuestSchema], default: [] },
  totalGuests: { type: Number, required: true, min: 0 },

  nidUrl:    { type: String, default: "", maxlength: 2048 },
  nidMethod: { type: String, default: "upload", maxlength: 20 },

  specialRequests: { type: String, default: "", maxlength: 2000 },

  basePrice: { type: Number, required: true, min: 0 },
  subtotal:  { type: Number, required: true, min: 0 },
  taxes:     { type: Number, default: 0,     min: 0 },

  offerId:       { type: ObjectId, ref: "Discount", default: null },
  offerDiscount: { type: Number, default: 0, min: 0 },

  couponId:       { type: ObjectId, ref: "Discount", default: null },
  couponCode:     { type: String, default: "", uppercase: true, maxlength: 50 },
  couponDiscount: { type: Number, default: 0, min: 0 },

  totalAmount:     { type: Number, required: true, min: 0 },
  advancePercent:  { type: Number, default: 100, min: 0, max: 100 },
  advanceAmount:   { type: Number, default: 0,   min: 0 },
  paidAmount:      { type: Number, default: 0,   min: 0 },
  remainingAmount: { type: Number, default: 0,   min: 0 },

  status: {
    type: String,
    enum: ["pending", "confirmed", "checked_in", "checked_out", "cancelled", "no_show"],
    default: "pending",
  },

  paymentMethod: {
    type: String,
    enum: ["sslcommerz", "pay_at_desk", "partial"],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["unpaid", "partial", "paid", "refunded", "failed"],
    default: "unpaid",
  },

  // SSLCommerz fields — sparse indexes below because most rows are empty strings
  transactionId: { type: String, default: "", maxlength: 100 },
  valId:         { type: String, default: "", maxlength: 100 },
  bankTxnId:     { type: String, default: "", maxlength: 100 },
  cardType:      { type: String, default: "", maxlength: 50  },

  termsAccepted:   { type: Boolean, default: false },
  termsAcceptedAt: { type: Date, default: null },

  bookedBy:   { type: ObjectId, ref: "User", default: null },
  adminNotes: { type: String, default: "", maxlength: 5000 },

  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date, default: Date.now },
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
//
// Naming convention:  most-selective field first, then range fields (checkIn/Out),
// then the low-cardinality filter (status) last — this gives the best IXScan
// efficiency on the availability conflict query.

// ── Availability conflict detection ──────────────────────────────────────────
// Covers: "is this room booked between these dates?" for BOTH booking paths
BookingSchema.index({ "roomBookings.room": 1, checkIn: 1, checkOut: 1 });
BookingSchema.index({ room: 1, checkIn: 1, checkOut: 1 });

// Property-level date range (dashboard availability grid)
BookingSchema.index({ property: 1, checkIn: 1, checkOut: 1 });

// ── Admin booking list ────────────────────────────────────────────────────────
BookingSchema.index({ status: 1, checkIn: 1 });          // status filter + date sort
BookingSchema.index({ status: 1, createdAt: -1 });       // status filter + newest first
BookingSchema.index({ createdAt: -1 });                   // default newest-first listing

// ── Payment lookups ───────────────────────────────────────────────────────────
// IPN callback: find booking by SSLCommerz transaction ID — CRITICAL hot path
// sparse=true means the index only stores docs where transactionId is non-empty
BookingSchema.index({ transactionId: 1 }, { sparse: true });
BookingSchema.index({ paymentStatus: 1 });
BookingSchema.index({ bookingMode: 1 });

// ── Guest lookups ─────────────────────────────────────────────────────────────
BookingSchema.index({ bookedBy: 1, createdAt: -1 });           // "my bookings" page
BookingSchema.index({ "primaryGuest.email": 1 });               // admin search by guest
BookingSchema.index({ couponCode: 1 }, { sparse: true });       // coupon usage reports

// ─── Model ────────────────────────────────────────────────────────────────────
export default mongoose.models.Booking || mongoose.model("Booking", BookingSchema);
