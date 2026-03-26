import mongoose from "mongoose";

const CorporateEventSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  image:       { type: String, required: true },
  client:      { type: String, trim: true, default: "" },
  eventDate:   { type: String, default: "" },
  tags:        [{ type: String }],
  isPublished: { type: Boolean, default: true },
  sortOrder:   { type: Number, default: 0 },
  createdAt:   { type: Date, default: Date.now },
});

CorporateEventSchema.index({ isPublished: 1, sortOrder: 1, createdAt: -1 });

export default mongoose.models.CorporateEvent ||
  mongoose.model("CorporateEvent", CorporateEventSchema);
