import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
  room:     { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  booking:  { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
  user:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rating:   { type: Number, required: true, min: 1, max: 5 },
  title:    { type: String, default: "", trim: true },
  body:     { type: String, default: "", trim: true },
  isApproved: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

ReviewSchema.index({ room: 1, user: 1 });
ReviewSchema.index({ booking: 1 }, { unique: true });

export default mongoose.models.Review || mongoose.model("Review", ReviewSchema);
