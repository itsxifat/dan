import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const DiscountSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, default: "", maxlength: 1000 },

  type: {
    type: String,
    enum: ["offer", "coupon"],
    required: true,
    default: "coupon",
  },

  // Stored uppercase. sparse = multiple nulls allowed without violating unique.
  code: {
    type:      String,
    default:   null,
    uppercase: true,
    trim:      true,
    maxlength: 50,
    sparse:    true,
  },

  discountType: {
    type: String,
    enum: ["percentage", "fixed"],
    required: true,
    default: "percentage",
  },

  discountValue:     { type: Number, required: true, min: 0 },
  maxDiscountAmount: { type: Number, default: 0, min: 0 },
  minOrderAmount:    { type: Number, default: 0, min: 0 },

  applicableTo: {
    type: String,
    enum: ["all", "night_stay", "day_long"],
    default: "all",
  },

  validFrom: { type: Date, required: true },
  validTo:   { type: Date, required: true },

  usageLimit: { type: Number, default: 0, min: 0 },
  usedCount:  { type: Number, default: 0, min: 0 },

  isPersonal:   { type: Boolean, default: false },
  assignedUser: { type: ObjectId, ref: "User", default: null },

  image:    { type: String, default: "", maxlength: 2048 },
  isActive: { type: Boolean, default: true },

  createdBy: { type: ObjectId, ref: "User", default: null },
  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date, default: Date.now },
});

// ─── Indexes ──────────────────────────────────────────────────────────────────

// ── Coupon validation — absolute hottest path ─────────────────────────────────
// Query: Discount.findOne({ code: X, isActive: true })
// Without this index: full collection scan on every checkout coupon lookup.
DiscountSchema.index({ code: 1, isActive: 1 }, { sparse: true });

// ── Auto-offer lookup ─────────────────────────────────────────────────────────
// Query: active offers applicable to a booking mode, within validity window
// getActiveOffers() does: { type: "offer", isActive: true, validFrom<=now, validTo>=now }
DiscountSchema.index({ type: 1, isActive: 1, validTo: 1 });

// ── General admin list + type filter ─────────────────────────────────────────
DiscountSchema.index({ isActive: 1, type: 1 });

// ── Personal coupon lookup (gift cards) ───────────────────────────────────────
DiscountSchema.index({ assignedUser: 1 }, { sparse: true });

// ─── Model ────────────────────────────────────────────────────────────────────
export default mongoose.models.Discount || mongoose.model("Discount", DiscountSchema);
