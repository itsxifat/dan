import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUsers } from "@/actions/admin/userActions";
import { hasPermission, ADMIN_ROLES } from "@/lib/permissions";
import UsersTable from "@/components/admin/UsersTable";
import Link from "next/link";

export const metadata = { title: "Users | Admin" };

export default async function UsersPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !ADMIN_ROLES.includes(session.user.role)) {
    redirect("/admin/login");
  }
  if (!hasPermission(session.user.role, "users.read")) {
    redirect("/admin/dashboard");
  }

  const params = await searchParams;
  const page   = Math.max(1, parseInt(params?.page   || "1"));
  const search = params?.search || "";
  const role   = params?.role   || "";
  const status = params?.status || "";

  const data = await getUsers({ page, search, role, status });

  const canAddAdmin = hasPermission(session.user.role, "admin.add");

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-7 max-w-6xl mx-auto w-full">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[11px] uppercase tracking-widest text-white/25 mb-1">Management</h2>
          <p className="text-[20px] font-light text-white leading-tight">All Users</p>
        </div>
        {canAddAdmin && (
          <Link
            href="/admin/users/add"
            className="flex items-center gap-2 px-4 py-2 bg-[#7A2267] hover:bg-[#8d2878]
              rounded-xl text-[10.5px] uppercase tracking-wider font-semibold text-white
              transition-colors duration-200"
          >
            <svg viewBox="0 0 14 14" width="11" height="11" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Add Admin
          </Link>
        )}
      </div>

      <UsersTable initialData={data} actorRole={session.user.role} />
    </div>
  );
}
