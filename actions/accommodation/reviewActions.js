"use server";

import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Review from "@/models/Review";
import Booking from "@/models/Booking";
import Room from "@/models/Room";

/**
 * Fetch all approved reviews for a room, newest first.
 * Populates reviewer name + image.
 */
export async function getReviewsForRoom(roomId) {
  await dbConnect();
  const reviews = await Review.find({ room: roomId, isApproved: true })
    .populate("user", "name image")
    .sort({ createdAt: -1 })
    .lean();
  return JSON.parse(JSON.stringify(reviews));
}

/**
 * Check if the current user can review a room.
 * Returns { canReview, bookingId, alreadyReviewed }
 */
export async function canUserReview(roomId, userId) {
  if (!userId || !roomId) return { canReview: false, bookingId: null, alreadyReviewed: false };

  await dbConnect();

  // Check if user already reviewed this room
  const existing = await Review.findOne({ room: roomId, user: userId }).lean();
  if (existing) return { canReview: false, bookingId: null, alreadyReviewed: true };

  // Check if user has a qualifying booking (checked_out or confirmed) for this room
  const booking = await Booking.findOne({
    room: roomId,
    bookedBy: userId,
    status: { $in: ["checked_out", "confirmed"] },
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!booking) return { canReview: false, bookingId: null, alreadyReviewed: false };

  return {
    canReview: true,
    bookingId: booking._id.toString(),
    alreadyReviewed: false,
  };
}

/**
 * Submit a review. Verifies eligibility, creates review, updates Room rating stats.
 */
export async function submitReview({ roomId, bookingId, rating, title, body, userId }) {
  if (!userId) throw new Error("Authentication required.");
  if (!roomId || !bookingId) throw new Error("Invalid review parameters.");
  if (!rating || rating < 1 || rating > 5) throw new Error("Rating must be between 1 and 5.");

  await dbConnect();

  // Verify eligibility again
  const existing = await Review.findOne({ room: roomId, user: userId }).lean();
  if (existing) throw new Error("You have already reviewed this room.");

  const booking = await Booking.findOne({
    _id: bookingId,
    room: roomId,
    bookedBy: userId,
    status: { $in: ["checked_out", "confirmed"] },
  }).lean();
  if (!booking) throw new Error("No qualifying booking found for this review.");

  // Create the review
  await Review.create({
    room: roomId,
    booking: bookingId,
    user: userId,
    rating: Number(rating),
    title: (title || "").trim(),
    body: (body || "").trim(),
    isApproved: true,
  });

  // Recalculate and update room avgRating + reviewCount
  const agg = await Review.aggregate([
    { $match: { room: new mongoose.Types.ObjectId(roomId), isApproved: true } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const avg = agg[0]?.avg ?? 0;
  const count = agg[0]?.count ?? 0;

  await Room.findByIdAndUpdate(roomId, {
    avgRating: Math.round(avg * 10) / 10,
    reviewCount: count,
  });

  return { success: true };
}
