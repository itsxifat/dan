import sharp from "sharp";

/**
 * Image optimisation applied before anything is sent to the CDN.
 *
 * EnCDN is plain storage — it serves files exactly as uploaded, with no
 * resizing or format negotiation. So we right-size and convert to WebP here,
 * once, at upload time. A full-screen hero PNG (~3 MB) becomes a ~250–350 KB
 * WebP with no visible quality loss.
 *
 * EnCDN does not accept AVIF, so WebP is the target modern format.
 */

// Cap the longest edge. 2560px covers retina/desktop full-bleed heroes; smaller
// originals are never upscaled.
const MAX_EDGE = 2560;
const QUALITY  = 80;

// Raster types we re-encode to WebP. GIF is left alone (animation), and
// video/audio/SVG/everything else passes through untouched.
const OPTIMIZABLE = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

export function isOptimizable(mimeType) {
  return OPTIMIZABLE.has(mimeType);
}

/**
 * Resize-down + convert a raster image buffer to WebP.
 * @param {Buffer} input
 * @returns {Promise<Buffer>} the optimised WebP bytes
 */
export async function optimizeToWebp(input) {
  return sharp(input, { failOn: "none" })
    .rotate() // bake in EXIF orientation, then strip metadata (sharp default)
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toBuffer();
}

/**
 * Optimise a web `File` for upload. Returns a descriptor ready for uploadToCdn:
 *   { buffer, filename, contentType }
 * Non-optimisable types (gif, video, audio) come back unchanged as a File.
 */
export async function optimizeFile(file) {
  if (!isOptimizable(file.type)) return file;

  const input  = Buffer.from(await file.arrayBuffer());
  const buffer  = await optimizeToWebp(input);
  const base     = (file.name || "image").replace(/\.[^.]+$/, "");
  return { buffer, filename: `${base}.webp`, contentType: "image/webp" };
}
