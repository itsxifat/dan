export function normalizePhoneNumber(value = "") {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  // Support Bangladesh local and international mobile formats consistently.
  if (/^01\d{9}$/.test(digits)) {
    return `880${digits.slice(1)}`;
  }

  if (/^8801\d{9}$/.test(digits)) {
    return digits;
  }

  return digits;
}

export function isLikelyEmail(value = "") {
  return String(value ?? "").includes("@");
}

export function normalizeAuthIdentifier(value = "") {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return {
      raw: "",
      type: "unknown",
      email: "",
      phone: "",
    };
  }

  if (isLikelyEmail(raw)) {
    return {
      raw,
      type: "email",
      email: raw.toLowerCase(),
      phone: "",
    };
  }

  return {
    raw,
    type: "phone",
    email: "",
    phone: normalizePhoneNumber(raw),
  };
}

export function isValidPhoneNumber(value = "") {
  return normalizePhoneNumber(value).length >= 10;
}
