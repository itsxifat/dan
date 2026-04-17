import mongoose from "mongoose";

const CorporateBrandSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  logo:        { type: String, default: "" },
  industry:    { type: String, default: "", trim: true },
  isPublished: { type: Boolean, default: true },
  sortOrder:   { type: Number, default: 0 },
  createdAt:   { type: Date, default: Date.now },
});

CorporateBrandSchema.index({ isPublished: 1, sortOrder: 1 });

export default mongoose.models.CorporateBrand ||
  mongoose.model("CorporateBrand", CorporateBrandSchema);
