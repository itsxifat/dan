// Guest identification & documentation rules.
//
// Pure utility — no DB, no React, no Node-only APIs — so the booking wizard,
// the server action, the emails, the invoice and the admin panel all derive the
// SAME answer from the SAME code. Never re-implement these rules inline.
//
// The rules:
//   1. Every guest (adult or child) must be listed by name, age and gender.
//   2. Every ADULT must present a NID / passport. Children never need any
//      document. Adults may upload during booking OR present the original at
//      check-in — but the guest has to explicitly consent to bringing them.
//   3. A room holding at least one adult male AND one adult female requires a
//      marriage certificate — uploaded during booking or carried to check-in.
//   4. Exemption to (3): the room also holds a child AND the guests declare
//      that the child is their own. Then no marriage certificate is needed,
//      but the child must actually be with them at check-in.

export const DEFAULT_MAX_FREE_CHILD_AGE = 5;

// Document handover choice made once per booking.
export const DOCS_UPLOAD_NOW = "upload_now";
export const DOCS_AT_CHECKIN = "at_checkin";

// ─── Guest classification ─────────────────────────────────────────────────────

/** A guest with no age entered yet is NOT assumed to be an adult. */
export function hasAge(guest) {
  const a = guest?.age;
  return a !== "" && a !== null && a !== undefined && !isNaN(Number(a));
}

export function isChildGuest(guest, maxFreeChildAge = DEFAULT_MAX_FREE_CHILD_AGE) {
  if (guest?.type === "child") return true;
  if (guest?.type === "adult") return false;
  if (!hasAge(guest)) return guest?._intent === "child";
  return Number(guest.age) <= maxFreeChildAge;
}

export function isAdultGuest(guest, maxFreeChildAge = DEFAULT_MAX_FREE_CHILD_AGE) {
  return hasAge(guest) && !isChildGuest(guest, maxFreeChildAge);
}

/** Adults still need a document even if we can't tell their age yet. */
function splitGuests(guests = [], maxFreeChildAge) {
  const adults   = [];
  const children = [];
  for (const g of guests) {
    if (isChildGuest(g, maxFreeChildAge)) children.push(g);
    else adults.push(g);
  }
  return { adults, children };
}

export function guestHasNid(guest) {
  return Boolean(String(guest?.nidNumber || "").trim() || guest?.nidUrl);
}

// ─── Per-room requirement ─────────────────────────────────────────────────────

/**
 * Work out what a single room's occupants have to produce.
 *
 * @param {object} roomInfo  { guests, ownChildDeclared, coupleDocumentUrl }
 * @param {object} opts      { maxFreeChildAge, requireCoupleDoc }
 */
export function evaluateRoom(roomInfo = {}, opts = {}) {
  const maxFreeChildAge = opts.maxFreeChildAge ?? DEFAULT_MAX_FREE_CHILD_AGE;
  const requireCoupleDoc = opts.requireCoupleDoc ?? true;

  const { adults, children } = splitGuests(roomInfo.guests || [], maxFreeChildAge);

  const hasAdultMale   = adults.some((g) => g.gender === "male");
  const hasAdultFemale = adults.some((g) => g.gender === "female");
  const isMixedGender  = hasAdultMale && hasAdultFemale;

  const hasChild         = children.length > 0;
  const ownChildDeclared = roomInfo.ownChildDeclared === true;
  // The exemption only exists when there is actually a child to bring.
  const exemptByOwnChild = isMixedGender && hasChild && ownChildDeclared;

  const requiresMarriageCert =
    requireCoupleDoc && isMixedGender && !exemptByOwnChild;

  const marriageCertUploaded = Boolean(roomInfo.coupleDocumentUrl);

  return {
    adults,
    children,
    adultCount:  adults.length,
    childCount:  children.length,
    isMixedGender,
    hasChild,
    ownChildDeclared,
    /** Exemption is active — the child must be brought to check-in instead. */
    exemptByOwnChild,
    /** Can the guest even choose the exemption? (mixed room with a child) */
    exemptionAvailable: requireCoupleDoc && isMixedGender && hasChild,
    requiresMarriageCert,
    marriageCertUploaded,
    /** Certificate is required but not on file — must be carried to check-in. */
    marriageCertPending: requiresMarriageCert && !marriageCertUploaded,
    adultsMissingNid: adults.filter((g) => !guestHasNid(g)),
  };
}

// ─── Booking-wide summary ─────────────────────────────────────────────────────

/**
 * Roll the per-room evaluations up into one object that every notice surface
 * (email, invoice, success page, admin) renders from.
 *
 * `rooms` is an array of { roomNumber, guests, ownChildDeclared, coupleDocumentUrl }.
 */
export function summariseBookingDocs({ rooms = [], guestDocsMethod = DOCS_AT_CHECKIN } = {}, opts = {}) {
  const evaluations = rooms.map((r) => {
    const ev = evaluateRoom(r, opts);
    // A booking stores the verdict reached when it was placed. Honour it so a
    // later settings change can't silently retract what the guest was told.
    const requiresMarriageCert =
      typeof r.storedRequiresMarriageCert === "boolean"
        ? r.storedRequiresMarriageCert
        : ev.requiresMarriageCert;

    return {
      roomNumber: r.roomNumber || "",
      ...ev,
      requiresMarriageCert,
      marriageCertPending: requiresMarriageCert && !ev.marriageCertUploaded,
    };
  });

  const certRooms   = evaluations.filter((e) => e.requiresMarriageCert);
  const exemptRooms = evaluations.filter((e) => e.exemptByOwnChild);

  const totalAdults = evaluations.reduce((n, e) => n + e.adultCount, 0);
  const totalChildren = evaluations.reduce((n, e) => n + e.childCount, 0);
  const adultsMissingNid = evaluations.reduce((n, e) => n + e.adultsMissingNid.length, 0);

  return {
    evaluations,
    totalAdults,
    totalChildren,
    guestDocsMethod,
    docsDeferred: guestDocsMethod !== DOCS_UPLOAD_NOW,
    adultsMissingNid,
    /** Any room at all needs a marriage certificate. */
    requiresMarriageCert: certRooms.length > 0,
    /** Certificate required but not uploaded — must be carried to check-in. */
    marriageCertPending:  certRooms.some((e) => e.marriageCertPending),
    marriageCertRooms:    certRooms.map((e) => e.roomNumber).filter(Boolean),
    /** Any room relying on the own-child exemption. */
    hasOwnChildExemption: exemptRooms.length > 0,
    ownChildRooms:        exemptRooms.map((e) => e.roomNumber).filter(Boolean),
    /** True when there is anything at all worth telling the guest about. */
    hasNotice: true,
  };
}

/**
 * Build a booking summary straight from a persisted Booking document
 * (roomBookings.room may or may not be populated).
 */
export function summariseFromBooking(booking = {}, settings = {}) {
  const rooms = (booking.roomBookings || []).map((rb) => ({
    roomNumber: rb.room?.roomNumber ? `#${rb.room.roomNumber}` : "",
    guests: rb.guests || [],
    ownChildDeclared:  rb.ownChildDeclared,
    coupleDocumentUrl: rb.coupleDocumentUrl,
    storedRequiresMarriageCert:
      typeof rb.requiresMarriageCert === "boolean" ? rb.requiresMarriageCert : undefined,
  }));

  return summariseBookingDocs(
    { rooms, guestDocsMethod: booking.guestDocsMethod || DOCS_AT_CHECKIN },
    {
      maxFreeChildAge:  settings.maxFreeChildAge  ?? DEFAULT_MAX_FREE_CHILD_AGE,
      requireCoupleDoc: settings.requireCoupleDoc ?? true,
    }
  );
}

// ─── Canonical guest-facing copy ──────────────────────────────────────────────
//
// Every channel (wizard, email, invoice, success page) uses these strings so the
// wording a guest sees never drifts between the website and their inbox.

export const DOC_COPY = {
  heading:      "Documents to bring at check-in",
  nidEveryone:
    "Every adult guest must carry their original NID or passport to check-in. Children do not need any documents.",
  nidPending:
    "Some guests' NID details were not uploaded during booking. Please have the originals ready at the reception desk.",
  nidUploaded:
    "NID details were uploaded during booking. Please still carry the originals for verification at the desk.",
  marriageCertRequired:
    "This booking places adult male and female guests in the same room, so a marriage certificate is required. Please bring the original (or a certified copy) to check-in.",
  marriageCertUploaded:
    "A marriage certificate has been uploaded for this booking. Please still carry the original to check-in for verification.",
  ownChildExemption:
    "You declared that the child travelling with you is your own, so no marriage certificate is required. The child must be present at check-in for this to apply.",
  refusalWarning:
    "Guests who cannot produce the required documents at check-in may be refused accommodation under our Terms & Conditions, and the booking may be treated as a no-show.",
};

/**
 * The ordered list of notice lines for a booking. Returns [] when nothing
 * applies, so callers can simply skip rendering the block.
 */
export function docNoticeLines(summary) {
  if (!summary) return [];
  const lines = [];

  lines.push(DOC_COPY.nidEveryone);
  if (summary.totalAdults > 0) {
    lines.push(summary.adultsMissingNid > 0 || summary.docsDeferred
      ? DOC_COPY.nidPending
      : DOC_COPY.nidUploaded);
  }

  if (summary.requiresMarriageCert) {
    lines.push(summary.marriageCertPending
      ? DOC_COPY.marriageCertRequired
      : DOC_COPY.marriageCertUploaded);
  }
  if (summary.hasOwnChildExemption) {
    lines.push(DOC_COPY.ownChildExemption);
  }

  lines.push(DOC_COPY.refusalWarning);
  return lines;
}

/** One-line headline used for badges and short summaries. */
export function docNoticeHeadline(summary) {
  if (!summary) return "";
  if (summary.marriageCertPending) return "NID for every adult + marriage certificate required";
  if (summary.requiresMarriageCert) return "NID for every adult + marriage certificate on file";
  if (summary.hasOwnChildExemption) return "NID for every adult · child must accompany you";
  return "NID required for every adult guest";
}

// ─── Validation shared by the wizard and the server action ────────────────────

/**
 * Validate the guest roster before a booking is placed.
 * Returns an array of human-readable problems (empty === valid).
 *
 * @param {object} input
 *   rooms:            [{ roomNumber, guests, ownChildDeclared, coupleDocumentUrl }]
 *   guestDocsMethod:  DOCS_UPLOAD_NOW | DOCS_AT_CHECKIN
 *   docsConsent:      boolean — guest ticked the "we will bring the documents" box
 *   expectedAdults / expectedChildren: party size chosen earlier in the flow
 */
export function validateGuestDocs(input = {}, opts = {}) {
  const {
    rooms = [],
    guestDocsMethod = DOCS_AT_CHECKIN,
    docsConsent = false,
    expectedAdults = null,
    expectedChildren = null,
  } = input;

  const maxFreeChildAge = opts.maxFreeChildAge ?? DEFAULT_MAX_FREE_CHILD_AGE;
  const errors = [];

  let adultTally = 0;
  let childTally = 0;

  for (const room of rooms) {
    const label = room.roomNumber ? `Room ${room.roomNumber}` : "Your room";
    const guests = room.guests || [];

    if (guests.length === 0) {
      errors.push(`${label}: please add the details of everyone staying in this room.`);
      continue;
    }

    guests.forEach((g, i) => {
      const who = String(g.name || "").trim() || `Guest ${i + 1}`;
      if (!String(g.name || "").trim()) {
        errors.push(`${label}: guest ${i + 1} needs a full name.`);
      }
      if (!hasAge(g)) {
        errors.push(`${label}: please enter ${who}'s age.`);
      }
      if (!g.gender) {
        errors.push(`${label}: please select ${who}'s gender.`);
      }
    });

    const ev = evaluateRoom(room, opts);
    adultTally += ev.adultCount;
    childTally += ev.childCount;

    if (guestDocsMethod === DOCS_UPLOAD_NOW) {
      for (const g of ev.adultsMissingNid) {
        const who = String(g.name || "").trim() || "an adult guest";
        errors.push(`${label}: add the NID number or upload the NID document for ${who}.`);
      }
      if (ev.requiresMarriageCert && !ev.marriageCertUploaded) {
        errors.push(`${label}: upload the marriage certificate, or choose to present the documents at check-in.`);
      }
    }
  }

  if (!docsConsent) {
    errors.push(
      guestDocsMethod === DOCS_UPLOAD_NOW
        ? "Please confirm that the uploaded documents belong to the guests staying and that the originals will be carried to check-in."
        : "Please confirm that every adult guest will bring their original NID — and the marriage certificate where required — to check-in."
    );
  }

  if (expectedAdults !== null && adultTally !== expectedAdults) {
    errors.push(
      `You selected ${expectedAdults} adult${expectedAdults !== 1 ? "s" : ""} but entered details for ${adultTally}. Everyone's details are now required.`
    );
  }
  if (expectedChildren !== null && childTally !== expectedChildren) {
    errors.push(
      `You selected ${expectedChildren} child${expectedChildren !== 1 ? "ren" : ""} but entered details for ${childTally}. Everyone's details are now required.`
    );
  }

  return errors;
}
