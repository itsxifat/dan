import mongoose from "mongoose";

const CorporateVisitRequestSchema = new mongoose.Schema({
  fullName:     { type: String, required: true, trim: true },
  company:      { type: String, required: true, trim: true },
  designation:  { type: String, required: true, trim: true },
  email:        { type: String, required: true, trim: true, lowercase: true },
  phone:        { type: String, required: true, trim: true },
  eventType:    { type: String, trim: true, default: "" },
  eventSummary: { type: String, required: true, trim: true },
  visitDate:    { type: String, required: true },
  visitTime:    { type: String, required: true },
  visitorCount: { type: Number, required: true, default: 1 },
  message:      { type: String, default: "" },
  status: {
    type: String,
    enum: ["new", "contacted", "confirmed", "cancelled"],
    default: "new",
  },
  createdAt: { type: Date, default: Date.now },
});

CorporateVisitRequestSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.CorporateVisitRequest ||
  mongoose.model("CorporateVisitRequest", CorporateVisitRequestSchema);
