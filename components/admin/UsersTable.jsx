"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ROLE_STYLES, ROLE_LABELS, STATUS_DOT, STATUS_LABELS, hasPermission } from "@/lib/permissions";
import { updateUserRole, updateUserStatus, deleteUser } from "@/actions/admin/userActions";

const ROLES   = ["owner", "admin", "moderator", "viewer", "user"];
const STATUSES = ["active", "suspended", "banned"];

function RoleBadge({ role }) {
  return (
    <span className={`inline-flex items-center text-[8.5px] uppercase tracking-wider
      font-semibold px-2 py-[3px] rounded-full ${ROLE_STYLES[role] || ROLE_STYLES.user}`}>
      {ROLE_LABELS[role] || role}
    </span>
  );
}

function StatusDot({ status }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[status] || "bg-white/20"}`} />
      <span className="text-[10.5px] text-white/45">{STATUS_LABELS[status] || status}</span>
    </span>
  );
}

function ConfirmModal({ user, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[#141414] border border-white/[0.08] rounded-2xl p-6 w-full max-w-[340px]
        shadow-[0_32px_80px_rgba(0,0,0,0.7)]">
        <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20
          flex items-center justify-center mb-4">
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" className="text-red-400">
            <path d="M8 3v5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M1.5 13.5L8 2l6.5 11.5H1.5z" stroke="currentColor" strokeWidth="1.3"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="text-[13px] font-semibold text-white mb-1">Delete user?</h3>
        <p className="text-[11px] text-white/40 mb-5 leading-relaxed">
          <span className="text-white/65">{user?.name}</span> ({user?.email}) will be permanently removed.
          This cannot be undone.
        </p>
        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl border border-white/[0.08] text-[11px]
              text-white/50 hover:text-white hover:border-white/20 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2 rounded-xl bg-red-500/90 hover:bg-red-500 text-white
              text-[11px] font-medium transition-colors duration-200 disabled:opacity-60"
          >
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionsMenu({ user, actorRole, onRoleChange, onStatusChange, onDelete }) {
  const [open, setOpen] = useState(false);
  const canModify = actorRole === "owner"
    ? true
    : user.role !== "owner" && actorRole === "admin";
  const canDelete = hasPermission(actorRole, "users.delete") && user.role !== "owner";

  if (!canModify && !canDelete) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg text-white/25 hover:text-white/70
          hover:bg-white/[0.06] transition-all duration-200"
      >
        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
          <circle cx="8" cy="3"  r="1.2" /><circle cx="8" cy="8"  r="1.2" /><circle cx="8" cy="13" r="1.2" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-[110] bg-[#161616] border border-white/[0.08]
            rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.7)] overflow-hidden min-w-[170px]">

            {canModify && (
              <>
                <p className="text-[8px] uppercase tracking-widest text-white/20 px-3 pt-2.5 pb-1 font-semibold">
                  Change Role
                </p>
                {ROLES.filter((r) => r !== user.role).map((r) => (
                  <button
                    key={r}
                    onClick={() => { onRoleChange(r); setOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left
                      text-[11px] text-white/50 hover:text-white hover:bg-white/[0.04]
                      transition-all duration-150"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      ROLE_STYLES[r]?.includes("amber") ? "bg-amber-400" :
                      ROLE_STYLES[r]?.includes("c05aae") ? "bg-[#7A2267]" :
                      ROLE_STYLES[r]?.includes("blue") ? "bg-blue-400" :
                      ROLE_STYLES[r]?.includes("emerald") ? "bg-emerald-400" : "bg-white/20"
                    }`} />
                    {ROLE_LABELS[r]}
                  </button>
                ))}

                <div className="h-px bg-white/[0.05] mx-3 my-1" />

                <p className="text-[8px] uppercase tracking-widest text-white/20 px-3 pt-1.5 pb-1 font-semibold">
                  Change Status
                </p>
                {STATUSES.filter((s) => s !== user.status).map((s) => (
                  <button
                    key={s}
                    onClick={() => { onStatusChange(s); setOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left
                      text-[11px] text-white/50 hover:text-white hover:bg-white/[0.04]
                      transition-all duration-150"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[s]}`} />
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </>
            )}

            {canDelete && (
              <>
                <div className="h-px bg-white/[0.05] mx-3 my-1" />
                <button
                  onClick={() => { onDelete(); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left
                    text-[11px] text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.05]
                    transition-all duration-150"
                >
                  <svg viewBox="0 0 14 14" width="11" height="11" fill="none">
                    <path d="M1.5 3.5h11M5 3.5V2h4v1.5M3 3.5l.5 8.5h7l.5-8.5"
                      stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Delete User
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function UsersTable({ initialData, actorRole }) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();
  const [toast,     setToast]        = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [search, setSearch] = useState(searchParams.get("search") || "");

  // Sync search to URL (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams(searchParams);
      if (search) p.set("search", search); else p.delete("search");
      p.delete("page");
      router.push(`${pathname}?${p.toString()}`);
    }, 380);
    return () => clearTimeout(t);
  }, [search]);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  function navigate(params) {
    const p = new URLSearchParams(searchParams);
    Object.entries(params).forEach(([k, v]) => {
      if (v) p.set(k, v); else p.delete(k);
    });
    if (params.role !== undefined || params.status !== undefined) p.delete("page");
    router.push(`${pathname}?${p.toString()}`);
  }

  function handleRoleChange(userId, newRole) {
    startTransition(async () => {
      try {
        await updateUserRole(userId, newRole);
        router.refresh();
        showToast("Role updated successfully");
      } catch (e) {
        showToast(e.message, "error");
      }
    });
  }

  function handleStatusChange(userId, newStatus) {
    startTransition(async () => {
      try {
        await updateUserStatus(userId, newStatus);
        router.refresh();
        showToast("Status updated successfully");
      } catch (e) {
        showToast(e.message, "error");
      }
    });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteUser(deleteTarget._id);
      router.refresh();
      showToast("User deleted");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  }

  const { users, total, pages, page } = initialData;
  const currentRole   = searchParams.get("role")   || "";
  const currentStatus = searchParams.get("status") || "";

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-[400] flex items-center gap-2.5 px-4 py-3
          rounded-xl border shadow-2xl text-[11.5px] font-medium
          ${toast.type === "error"
            ? "bg-red-500/10 border-red-500/25 text-red-400"
            : "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
          }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            toast.type === "error" ? "bg-red-400" : "bg-emerald-400"
          }`} />
          {toast.msg}
        </div>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <ConfirmModal
          user={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none"
            viewBox="0 0 14 14" width="12" height="12" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M9.5 9.5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users…"
            className="w-full pl-8 pr-3 py-2 bg-white/[0.04] border border-white/[0.07]
              rounded-xl text-[11.5px] text-white placeholder-white/20
              focus:outline-none focus:border-white/15 transition-colors duration-200"
          />
        </div>

        {/* Role filter */}
        <select
          value={currentRole}
          onChange={(e) => navigate({ role: e.target.value })}
          className="bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2
            text-[11.5px] text-white/60 focus:outline-none focus:border-white/15
            transition-colors duration-200 cursor-pointer appearance-none pr-7"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(255,255,255,0.3)' strokeWidth='1.2' strokeLinecap='round'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
        >
          <option value="">All Roles</option>
          {["owner","admin","moderator","viewer","user"].map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={currentStatus}
          onChange={(e) => navigate({ status: e.target.value })}
          className="bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2
            text-[11.5px] text-white/60 focus:outline-none focus:border-white/15
            transition-colors duration-200 cursor-pointer appearance-none pr-7"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(255,255,255,0.3)' strokeWidth='1.2' strokeLinecap='round'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
        >
          <option value="">All Status</option>
          {["active","suspended","banned"].map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>

        <span className="ml-auto text-[10.5px] text-white/25 hidden sm:block">
          {total} user{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Pending overlay */}
      {isPending && (
        <div className="absolute inset-0 z-10 bg-[#0a0a0a]/50 rounded-xl
          flex items-center justify-center">
          <span className="w-5 h-5 border border-white/20 border-t-white/60 rounded-full animate-spin" />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-white/[0.05]">
              {["User", "Role", "Status", "Joined", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[9px] uppercase tracking-widest
                  text-white/25 font-semibold first:pl-5 last:pr-4">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-14 text-[11.5px] text-white/20">
                  No users found
                </td>
              </tr>
            ) : users.map((user) => (
              <tr
                key={user._id}
                className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors duration-150"
              >
                {/* User cell */}
                <td className="px-4 py-3.5 pl-5">
                  <div className="flex items-center gap-3">
                    <Image
                      src={
                        user.image ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=7A2267&color=fff&size=64`
                      }
                      alt={user.name}
                      width={30}
                      height={30}
                      className="rounded-full object-cover border border-white/10 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-white/85 leading-tight truncate max-w-[160px]">
                        {user.name}
                      </p>
                      <p className="text-[10px] text-white/30 truncate max-w-[160px]">{user.email}</p>
                    </div>
                  </div>
                </td>
                {/* Role */}
                <td className="px-4 py-3.5"><RoleBadge role={user.role} /></td>
                {/* Status */}
                <td className="px-4 py-3.5 hidden sm:table-cell"><StatusDot status={user.status} /></td>
                {/* Joined */}
                <td className="px-4 py-3.5 hidden md:table-cell">
                  <span className="text-[10.5px] text-white/30">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </span>
                </td>
                {/* Actions */}
                <td className="px-4 py-3.5 pr-4 text-right">
                  <ActionsMenu
                    user={user}
                    actorRole={actorRole}
                    onRoleChange={(r) => handleRoleChange(user._id, r)}
                    onStatusChange={(s) => handleStatusChange(user._id, s)}
                    onDelete={() => setDeleteTarget(user)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <span className="text-[10.5px] text-white/25">
            Page {page} of {pages}
          </span>
          <div className="flex gap-1.5">
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => navigate({ page: p })}
                className={`w-7 h-7 rounded-lg text-[11px] font-medium transition-all duration-150
                  ${p === page
                    ? "bg-[#7A2267] text-white"
                    : "bg-white/[0.04] text-white/35 hover:bg-white/[0.08] hover:text-white"
                  }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
