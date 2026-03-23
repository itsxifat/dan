import mongoose from "mongoose";

const MediaSchema = new mongoose.Schema({
  filename:     { type: String, required: true },
  url:          { type: String, required: true },
  originalName: { type: String, required: true },
  size:         { type: Number, required: true },
  mimeType:     { type: String, required: true },
  alt:          { type: String, default: "" },
  uploadedAt:   { type: Date, default: Date.now },
});

MediaSchema.index({ uploadedAt: -1 });

export default mongoose.models.Media || mongoose.model("Media", MediaSchema);
