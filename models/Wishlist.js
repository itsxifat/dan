import mongoose from "mongoose";

const WishlistSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  property: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
  addedAt:  { type: Date, default: Date.now },
});

WishlistSchema.index({ user: 1, property: 1 }, { unique: true });

export default mongoose.models.Wishlist || mongoose.model("Wishlist", WishlistSchema);
