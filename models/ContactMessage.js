import mongoose from "mongoose";

const ContactMessageSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  email:     { type: String, required: true },
  phone:     { type: String, default: "" },
  subject:   { type: String, default: "" },
  message:   { type: String, required: true },
  status:    { type: String, enum: ["new", "read", "replied"], default: "new" },
  reply:     { type: String, default: "" },
  repliedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.ContactMessage || mongoose.model("ContactMessage", ContactMessageSchema);
