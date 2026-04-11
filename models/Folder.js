import mongoose from "mongoose";

const FolderSchema = new mongoose.Schema({
  name:      { type: String, required: true, unique: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Folder || mongoose.model("Folder", FolderSchema);
