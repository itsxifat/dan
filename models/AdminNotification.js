import mongoose from "mongoose";

const AdminNotificationSchema = new mongoose.Schema(
  {
    type: {
      type:    String,
      enum:    ["booking", "review", "corporate", "payment", "system"],
      default: "system",
    },
    title:    { type: String, required: true },
    message:  { type: String, default: "" },
    link:     { type: String, default: "" },
    isRead:   { type: Boolean, default: false },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default mongoose.models.AdminNotification ||
  mongoose.model("AdminNotification", AdminNotificationSchema);
