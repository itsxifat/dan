import mongoose from "mongoose";

const MediaSchema = new mongoose.Schema({
  filename:     { type: String, required: true }, // CDN filename — last path segment of url
  cdnId:        { type: String, default: "" },     // EnCDN media id (delete-by-id fallback)
  url:          { type: String, required: true },  // CDN public delivery URL
  originalName: { type: String, required: true },
  size:         { type: Number, required: true },
  mimeType:     { type: String, required: true },
  alt:          { type: String, default: "" },
  folder:       { type: String, default: "general", index: true },
  uploadedAt:   { type: Date, default: Date.now },
});

MediaSchema.index({ uploadedAt: -1 });

export default mongoose.models.Media || mongoose.model("Media", MediaSchema);
