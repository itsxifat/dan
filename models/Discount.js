import mongoose from "mongoose";

/**
 * Discount — covers both admin-created offers (automatic) and coupon codes
 * (code-based, including personal gift cards).
 */
const DiscountSchema = new mongoose.Schema({
  // Display name, e.g. "Summer Sale 20% Off"
  name: { type: String, required: true, trim: true },

  // Short description shown to users
  description: { type: String, default: "" },

  // "offer" = shown publicly / applied automatically on qualifying orders
  // "coupon" = requires a code to be entered at checkout
  type: { type: String, enum: ["offer", "coupon"], required: true, default: "coupon" },

  // Unique code (only for type === "coupon"). Stored uppercase.
  code: {
    type: String,
    default: null,
    uppercase: true,
    trim: true,
    sparse: true, // allows multiple nulls
  },

  discountType: {
    type: String,
    enum: ["percentage", "fixed"],
    required: true,
    default: "percentage",
  },

  // % off or flat amount off in BDT
  discountValue: { type: Number, required: true, min: 0 },

  // For percentage discounts: maximum discount amount (BDT). 0 = no cap.
  maxDiscountAmount: { type: Number, default: 0 },

  // Minimum order total required to apply this discount
  minOrderAmount: { type: Number, default: 0 },

  // Which booking type this applies to
  applicableTo: {
    type: String,
    enum: ["all", "night_stay", "day_long"],
    default: "all",
  },

  // Validity window
  validFrom: { type: Date, required: true },
  validTo:   { type: Date, required: true },

  // Usage limits. 0 = unlimited.
  usageLimit: { type: Number, default: 0 },
  usedCount:  { type: Number, default: 0 },

  // Personal coupon — can only be used by one specific user
  isPersonal:   { type: Boolean, default: false },
  assignedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

  // Optional image (shown in notification/coupon card)
  image: { type: String, default: "" },

  isActive: { type: Boolean, default: true },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

DiscountSchema.index({ isActive: 1, type: 1 });
DiscountSchema.index({ assignedUser: 1 });

export default mongoose.models.Discount || mongoose.model("Discount", DiscountSchema);
