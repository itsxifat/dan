import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in environment variables.");
}

/**
 * Connection options tuned for production throughput and resilience.
 *
 * Pool sizing:
 *   maxPoolSize  – maximum concurrent MongoDB connections per Node process.
 *                  Next.js SSR/API routes are synchronous per-request, so 50
 *                  is a safe ceiling that avoids exhausting the server's file
 *                  descriptor limit while handling traffic spikes.
 *   minPoolSize  – connections kept alive even when idle so the first request
 *                  after a quiet period doesn't pay the TCP-handshake cost.
 *
 * Compression:
 *   zlib on the wire cuts bandwidth by 60-80 % for typical document payloads.
 *
 * Write concern:
 *   w: 1  is the sensible default for a standalone/single-node deployment.
 *   For a replica set change to  w: "majority", j: true  to guarantee that
 *   a write has been committed to disk on a quorum before the call returns.
 *
 * Timeouts are intentionally conservative to surface slow queries quickly
 * rather than letting them pile up and degrade the whole server.
 */
const MONGO_OPTS = {
  // ── Connection pool ────────────────────────────────────────────────────────
  maxPoolSize:       50,   // max simultaneous connections
  minPoolSize:        5,   // always keep 5 warm
  maxIdleTimeMS:  60_000,  // close connections idle for > 60 s

  // ── Timeouts ────────────────────────────────────────────────────────────────
  serverSelectionTimeoutMS:  5_000,  // give up trying to find a server after 5 s
  connectTimeoutMS:         10_000,  // TCP connect timeout
  socketTimeoutMS:          45_000,  // max time a query may stay in-flight

  // ── Reliability ────────────────────────────────────────────────────────────
  retryWrites:            true,   // automatically retry transient write errors
  retryReads:             true,   // automatically retry transient read errors
  heartbeatFrequencyMS: 10_000,  // check server health every 10 s

  // ── Wire compression (saves significant bandwidth on large result sets) ────
  compressors: ["zlib"],

  // ── Write concern (change w to "majority" + add j: true for replica sets) ─
  writeConcern: { w: 1 },

  // ── Buffering ──────────────────────────────────────────────────────────────
  // Disabled so queries thrown before the connection is ready fail immediately
  // (we always await dbConnect() so this is safe).
  bufferCommands: false,

  // ── Auto-create indexes in dev; rely on atlas/manual in prod ──────────────
  autoIndex: process.env.NODE_ENV !== "production",
};

// ─── Global cache — survives Next.js hot-reloads in dev ──────────────────────
let cached = global.__mongoose_cache;
if (!cached) {
  cached = global.__mongoose_cache = { conn: null, promise: null };
}

export default async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, MONGO_OPTS)
      .then((m) => {
        // Log slow queries (> 100 ms) to help spot missing indexes in dev/staging
        if (process.env.NODE_ENV !== "production") {
          mongoose.set("debug", false); // flip to true for full query logging
        }
        return m;
      })
      .catch((err) => {
        cached.promise = null; // allow retry on next call
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
