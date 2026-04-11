import mongoose from "mongoose";

const RoomLogSchema = new mongoose.Schema({
  room:     { type: mongoose.Schema.Types.ObjectId, ref: "Room",    required: true, index: true },
  property: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },

  // What happened
  type: {
    type: String,
    enum: [
      "check_in",               // Guest checked in
      "check_out",              // Guest checked out
      "status_change",          // Room status changed manually
      "maintenance_added",      // Maintenance issue reported
      "maintenance_resolved",   // Maintenance issue resolved
      "offline_booking_created",// Offline booking created
      "offline_booking_updated",// Offline booking modified
      "offline_booking_cancelled",// Offline booking cancelled
      "payment_received",       // Payment recorded for offline booking
      "note",                   // General staff note
      "conflict_detected",      // Online/offline booking conflict found
      "conflict_resolved",      // Conflict resolved
      "transfer_in",            // Guest transferred INTO this room
      "transfer_out",           // Guest transferred OUT of this room
    ],
    required: true,
  },

  // Human-readable description
  message: { type: String, required: true },

  // Linked documents (optional context)
  booking:        { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
  offlineBooking: { type: mongoose.Schema.Types.ObjectId, ref: "OfflineBooking" },

  // Who performed the action
  performedBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  performedByName: { type: String }, // Cached name in case user is deleted

  // Extra structured data (previous status, new status, amount, etc.)
  meta: { type: mongoose.Schema.Types.Mixed },

  createdAt: { type: Date, default: Date.now },
});

RoomLogSchema.index({ room: 1, createdAt: -1 });
RoomLogSchema.index({ property: 1, createdAt: -1 });
RoomLogSchema.index({ type: 1 });

export default mongoose.models.RoomLog || mongoose.model("RoomLog", RoomLogSchema);
