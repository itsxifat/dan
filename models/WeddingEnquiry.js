import mongoose from "mongoose";

const WeddingEnquirySchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, trim: true, lowercase: true },
  phone:      { type: String, required: true, trim: true },
  eventDate:  { type: String, default: "" },
  guestCount: { type: Number, default: 0 },
  venue:      { type: String, default: "" },
  message:    { type: String, default: "" },
  status: {
    type:    String,
    enum:    ["new", "contacted", "confirmed", "cancelled"],
    default: "new",
  },
  createdAt: { type: Date, default: Date.now },
});

WeddingEnquirySchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.WeddingEnquiry ||
  mongoose.model("WeddingEnquiry", WeddingEnquirySchema);
