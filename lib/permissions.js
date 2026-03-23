// Pure utility — safe to import in both client and server components

export const ADMIN_ROLES = ["owner", "admin", "moderator", "viewer"];

export const ROLE_LABELS = {
  owner:     "Owner",
  admin:     "Admin",
  moderator: "Moderator",
  viewer:    "Viewer",
  user:      "User",
};

export const ROLE_STYLES = {
  owner:     "bg-amber-400/10 text-amber-400 border border-amber-400/25",
  admin:     "bg-[#7A2267]/20 text-[#c05aae] border border-[#7A2267]/35",
  moderator: "bg-blue-500/10 text-blue-400 border border-blue-500/25",
  viewer:    "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25",
  user:      "bg-white/5 text-white/35 border border-white/10",
};

export const STATUS_DOT = {
  active:    "bg-emerald-400",
  suspended: "bg-amber-400",
  banned:    "bg-red-500",
};

export const STATUS_LABELS = {
  active:    "Active",
  suspended: "Suspended",
  banned:    "Banned",
};

const ROLE_PERMISSIONS = {
  owner: ["*"],
  admin: [
    "users.read", "users.write", "users.delete", "dashboard.read", "admin.add",
    "accommodation.read", "accommodation.write",
    "bookings.read", "bookings.write",
    "settings.write",
  ],
  moderator: [
    "users.read", "users.write", "dashboard.read",
    "accommodation.read",
    "bookings.read", "bookings.write",
  ],
  viewer: [
    "users.read", "dashboard.read",
    "accommodation.read",
    "bookings.read",
  ],
  user: [],
};

export function hasPermission(role, permission) {
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes("*") || perms.includes(permission);
}

/** Can actorRole change targetRole's role / status / delete them? */
export function canModifyUser(actorRole, targetRole) {
  if (actorRole === "owner") return true;
  if (targetRole === "owner") return false;
  if (actorRole === "admin") return true;
  return false;
}

/** Can actorRole assign newRole to someone? */
export function canAssignRole(actorRole, newRole) {
  if (actorRole === "owner") return true;
  if (newRole === "owner") return false;
  if (actorRole === "admin") return ["admin", "moderator", "viewer", "user"].includes(newRole);
  return false;
}
