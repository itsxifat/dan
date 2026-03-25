import mongoose from "mongoose";

const GuestSchema = new mongoose.Schema({
  name:   { type: String, required: true, trim: true },
  age:    { type: Number, required: true },
  gender: { type: String, enum: ["male", "female", "other"], required: true },
  type:   { type: String, enum: ["adult", "child"], required: true },
}, { _id: false });

/** Per-room allocation within a multi-room booking */
const RoomBookingSchema = new mongoose.Schema({
  room:     { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "RoomCategory", default: null },
  pricePerNight:     { type: Number, required: true },
  pricePerDay:       { type: Number, default: 0 },
  guests:            [GuestSchema],
  isCoupleRoom:      { type: Boolean, default: false },
  coupleDocumentUrl: { type: String, default: "" },
  coupleDocMethod:   { type: String, default: "" },
}, { _id: false });

const BookingSchema = new mongoose.Schema({
  bookingNumber: { type: String, required: true, unique: true },

  bookingMode: {
    type: String,
    enum: ["night_stay", "day_long"],
    required: true,
    default: "night_stay",
  },

  property:    { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
  bookingType: { type: String, enum: ["room", "cottage"], required: true },

  // Multi-room allocations
  roomBookings: [RoomBookingSchema],

  // Cottage / backwards compat
  category: { type: mongoose.Schema.Types.ObjectId, ref: "RoomCategory", default: null },
  room:      { type: mongoose.Schema.Types.ObjectId, ref: "Room", default: null },

  // Day-long package (optional)
  dayLongPackage: { type: mongoose.Schema.Types.ObjectId, ref: "DayLongPackage", default: null },

  checkIn:   { type: Date, required: true },
  checkOut:  { type: Date, required: true },
  nights:    { type: Number, required: true },

  primaryGuest: {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, lowercase: true, trim: true },
    phone:    { type: String, required: true, trim: true },
    whatsapp: { type: String, default: "" },
    gender:   { type: String, enum: ["male", "female", "other"], required: true },
    age:      { type: Number, required: true },
  },

  allGuests:   [GuestSchema],
  totalGuests: { type: Number, required: true },

  nidUrl:    { type: String, default: "" },
  nidMethod: { type: String, default: "upload" },

  specialRequests: { type: String, default: "" },

  basePrice:      { type: Number, required: true },
  subtotal:       { type: Number, required: true },
  taxes:          { type: Number, default: 0 },
  totalAmount:    { type: Number, required: true },
  advancePercent: { type: Number, default: 100 },
  advanceAmount:  { type: Number, default: 0 },
  paidAmount:     { type: Number, default: 0 },
  remainingAmount:{ type: Number, default: 0 },

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
  transactionId: { type: String, default: "" },
  valId:         { type: String, default: "" },
  bankTxnId:     { type: String, default: "" },
  cardType:      { type: String, default: "" },

  bookedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  adminNotes: { type: String, default: "" },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

BookingSchema.index({ property: 1, checkIn: 1, checkOut: 1 });
BookingSchema.index({ "roomBookings.room": 1, checkIn: 1, checkOut: 1 });
BookingSchema.index({ room: 1, checkIn: 1, checkOut: 1 });
BookingSchema.index({ status: 1, checkIn: 1 });
BookingSchema.index({ bookedBy: 1 });
BookingSchema.index({ paymentStatus: 1 });
BookingSchema.index({ bookingMode: 1 });

export default mongoose.models.Booking || mongoose.model("Booking", BookingSchema);
