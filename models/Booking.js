import mongoose from "mongoose";

const GuestSchema = new mongoose.Schema({
  name:   { type: String, required: true, trim: true },
  age:    { type: Number, required: true },
  gender: { type: String, enum: ["male", "female", "other"], required: true },
  type:   { type: String, enum: ["adult", "child"], required: true },
}, { _id: false });

const BookingSchema = new mongoose.Schema({
  bookingNumber: { type: String, required: true, unique: true },

  property:  { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
  category:  { type: mongoose.Schema.Types.ObjectId, ref: "RoomCategory", default: null },
  room:      { type: mongoose.Schema.Types.ObjectId, ref: "Room", default: null },
  bookingType: { type: String, enum: ["room", "cottage"], required: true },

  checkIn:   { type: Date, required: true },
  checkOut:  { type: Date, required: true },
  nights:    { type: Number, required: true },

  primaryGuest: {
    name:    { type: String, required: true, trim: true },
    email:   { type: String, required: true, lowercase: true, trim: true },
    phone:   { type: String, required: true, trim: true },
    whatsapp:{ type: String, default: "" },
    gender:  { type: String, enum: ["male", "female", "other"], required: true },
    age:     { type: Number, required: true },
  },

  guests:      [GuestSchema],
  totalGuests: { type: Number, required: true },

  // Couple booking
  isCoupleBooking:    { type: Boolean, default: false },
  coupleDocumentUrl:  { type: String, default: "" },
  coupleDocMethod:    { type: String, enum: ["online", "desk", ""], default: "" },

  specialRequests: { type: String, default: "" },

  // Pricing
  basePrice:   { type: Number, required: true },
  subtotal:    { type: Number, required: true },
  taxes:       { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },

  // Status
  status: {
    type: String,
    enum: ["pending", "confirmed", "checked_in", "checked_out", "cancelled", "no_show"],
    default: "pending",
  },

  // Payment
  paymentMethod: { type: String, enum: ["sslcommerz", "pay_at_desk"], required: true },
  paymentStatus: { type: String, enum: ["unpaid", "paid", "refunded", "failed"], default: "unpaid" },
  transactionId: { type: String, default: "" },
  valId:         { type: String, default: "" },
  bankTxnId:     { type: String, default: "" },
  cardType:      { type: String, default: "" },
  paidAmount:    { type: Number, default: 0 },

  // Booking source
  bookedBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

  // Admin
  adminNotes:   { type: String, default: "" },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

BookingSchema.index({ bookingNumber: 1 });
BookingSchema.index({ property: 1, checkIn: 1, checkOut: 1 });
BookingSchema.index({ room: 1, checkIn: 1, checkOut: 1 });
BookingSchema.index({ status: 1, checkIn: 1 });
BookingSchema.index({ bookedBy: 1 });
BookingSchema.index({ paymentStatus: 1 });

export default mongoose.models.Booking || mongoose.model("Booking", BookingSchema);
