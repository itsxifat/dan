import mongoose from "mongoose";

const SectionSchema = new mongoose.Schema(
  {
    title:   { type: String, default: "" },
    content: { type: String, default: "" },
  },
  { _id: false }
);

const LegalDocumentSchema = new mongoose.Schema({
  type:          { type: String, enum: ["terms", "privacy"], required: true, unique: true },
  title:         { type: String, default: "" },
  effectiveDate: { type: String, default: "" },
  intro:         { type: String, default: "" },
  sections:      { type: [SectionSchema], default: [] },
  updatedAt:     { type: Date, default: Date.now },
});

export default mongoose.models.LegalDocument ||
  mongoose.model("LegalDocument", LegalDocumentSchema);
