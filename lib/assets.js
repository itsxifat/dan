/**
 * Static chrome asset URLs (logo / hero).
 *
 * After running `scripts/migrate-to-cdn.js`, set the NEXT_PUBLIC_* vars to the
 * printed EnCDN plain public delivery URLs. Pre-migration they fall back to the
 * bundled /public paths so nothing breaks. Safe to expose to the client —
 * plain public delivery URLs (no secret involved).
 *
 * NOTE: emails must use a *signed* logo URL (no whitelisted Referer in mail
 * clients) — see lib/email.js, which signs LOGO_URL via lib/cdn.
 */
export const LOGO_URL          = process.env.NEXT_PUBLIC_LOGO_URL          || "/logo.png";
export const HERO_URL          = process.env.NEXT_PUBLIC_HERO_URL          || "/hero.png";
export const HERO_FALLBACK_URL = process.env.NEXT_PUBLIC_HERO_FALLBACK_URL || "/hero.jpeg";

// About-section decorative images.
export const ABOUT_LEFT_URL    = process.env.NEXT_PUBLIC_ABOUT_LEFT_URL    || "/section/about/left.png";
export const ABOUT_MIDDLE_URL  = process.env.NEXT_PUBLIC_ABOUT_MIDDLE_URL  || "/section/about/middle.png";
export const ABOUT_RIGHT_URL   = process.env.NEXT_PUBLIC_ABOUT_RIGHT_URL   || "/section/about/right.png";
