export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Ensure slug is unique in the given Mongoose Model. Appends -2, -3 … if needed. */
export async function uniqueSlug(Model, baseSlug, excludeId = null) {
  let slug = baseSlug;
  let counter = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const query = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    const exists = await Model.exists(query);
    if (!exists) return slug;
    slug = `${baseSlug}-${counter++}`;
  }
}
