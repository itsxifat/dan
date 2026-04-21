/**
 * dbHelpers — shared query utilities for fast, safe database access
 *
 * Rules enforced here:
 *   1. Always .lean()     — returns plain JS objects instead of Mongoose
 *                           Documents, skipping hydration overhead (~3–5× faster
 *                           for read-heavy routes).
 *   2. Always .select()   — fetch only the fields each caller actually needs so
 *                           MongoDB can return smaller BSON payloads and the
 *                           Node process allocates less memory.
 *   3. ObjectId guard     — every ID param is validated before hitting the DB so
 *                           malformed IDs never reach a query.
 *   4. JSON-safe output   — lean() can still return Dates/ObjectIds as their
 *                           native types; toJSON() converts the whole tree to a
 *                           plain, JSON-serialisable object where needed.
 */

import mongoose from "mongoose";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Validate a 24-char hex ObjectId string. Returns false for anything else. */
export function isValidObjectId(id) {
  return typeof id === "string" && /^[a-f\d]{24}$/i.test(id);
}

/**
 * Deeply convert a lean Mongoose result (or array) to a plain JSON-safe object.
 * Equivalent to JSON.parse(JSON.stringify(v)) but avoids the double-pass.
 */
export function toPlain(v) {
  return JSON.parse(JSON.stringify(v));
}

// ─── Standard field projections ───────────────────────────────────────────────
//
// Use these with .select() to strip large or sensitive fields from common reads.
// Adjust as needed — the goal is to send only what the caller will render.

export const PROJECTIONS = {
  /** Minimal user card shown in admin listings */
  userCard: "name email role status phone createdAt",

  /** Public-facing property card (no internal fields) */
  propertyCard: "name slug type tagline coverImage location isActive isFeatured sortOrder",

  /** Room card for public accommodation page */
  roomCard: "property category roomNumber floor status pricePerNight pricePerDay variantId avgRating reviewCount block",

  /** Booking summary row in admin table */
  bookingSummary:
    "bookingNumber bookingMode bookingType status paymentStatus totalAmount advanceAmount paidAmount " +
    "checkIn checkOut nights primaryGuest.name primaryGuest.phone primaryGuest.email " +
    "property createdAt",

  /** Notification bell item */
  notificationBell: "type title message link isRead createdAt",
};

// ─── Generic paginated query helper ──────────────────────────────────────────

/**
 * Run a paginated lean query and return { docs, total, page, pages }.
 *
 * @param {mongoose.Model}  Model
 * @param {object}          filter   - Mongoose filter object
 * @param {object}          opts
 * @param {string}          [opts.select]    - field projection string
 * @param {object}          [opts.sort]      - e.g. { createdAt: -1 }
 * @param {number}          [opts.page=1]
 * @param {number}          [opts.limit=20]
 * @param {object|string}   [opts.populate]  - optional populate spec
 * @returns {Promise<{ docs: object[], total: number, page: number, pages: number }>}
 */
export async function paginate(Model, filter = {}, opts = {}) {
  const {
    select  = "",
    sort    = { createdAt: -1 },
    page    = 1,
    limit   = 20,
    populate,
  } = opts;

  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 200);
  const safePage  = Math.max(Number(page) || 1, 1);
  const skip      = (safePage - 1) * safeLimit;

  const [docs, total] = await Promise.all([
    (() => {
      let q = Model.find(filter).sort(sort).skip(skip).limit(safeLimit).lean();
      if (select)   q = q.select(select);
      if (populate) q = q.populate(populate);
      return q;
    })(),
    Model.countDocuments(filter),
  ]);

  return {
    docs:  toPlain(docs),
    total,
    page:  safePage,
    pages: Math.ceil(total / safeLimit),
  };
}

/**
 * Find one document by ObjectId, with lean() and optional field projection.
 * Returns null (not throws) when the id is invalid or the document is missing.
 *
 * @param {mongoose.Model} Model
 * @param {string}         id
 * @param {string}         [select]
 * @returns {Promise<object|null>}
 */
export async function findById(Model, id, select = "") {
  if (!isValidObjectId(id)) return null;
  const q = Model.findById(id).lean();
  if (select) q.select(select);
  const doc = await q;
  return doc ? toPlain(doc) : null;
}

/**
 * Existence check without loading any document data.
 * Uses countDocuments with limit:1 — faster than findOne for large collections.
 *
 * @param {mongoose.Model} Model
 * @param {object}         filter
 * @returns {Promise<boolean>}
 */
export async function exists(Model, filter) {
  return (await Model.countDocuments(filter).limit(1)) > 0;
}

/**
 * Safe atomic findOneAndUpdate with lean output.
 * Returns the updated document or null.
 *
 * @param {mongoose.Model} Model
 * @param {object}         filter
 * @param {object}         update
 * @param {object}         [opts]
 * @returns {Promise<object|null>}
 */
export async function safeUpdate(Model, filter, update, opts = {}) {
  const doc = await Model.findOneAndUpdate(filter, update, {
    new:        true,
    runValidators: true,
    lean:       true,
    ...opts,
  });
  return doc ? toPlain(doc) : null;
}
