import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardStats } from "@/actions/admin/dashboardActions";
import { ROLE_STYLES, ROLE_LABELS, STATUS_DOT, STATUS_LABELS, ADMIN_ROLES } from "@/lib/permissions";
import Image from "next/image";

export const metadata = { title: "Dashboard | Admin" };

function StatCard({ label, value, sub, color = "white" }) {
  return (
    <div className="bg-[#111] border border-white/[0.06] rounded-2xl px-5 py-5
      hover:border-white/[0.1] transition-colors duration-300">
      <p className="text-[9.5px] uppercase tracking-widest text-white/25 font-semibold mb-3">{label}</p>
      <p className={`text-[2rem] font-light leading-none mb-1.5
        ${color === "purple" ? "text-[#c05aae]" : "text-white"}`}>
        {value ?? 0}
      </p>
      {sub && <p className="text-[10px] text-white/25">{sub}</p>}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !ADMIN_ROLES.includes(session.user.role)) {
    redirect("/admin/login");
  }

  const stats = await getDashboardStats();
  const { totalUsers, newThisWeek, newThisMonth, roleDist, statusDist, recentUsers } = stats;

  const teamCount = (roleDist.owner || 0) + (roleDist.admin || 0) +
                    (roleDist.moderator || 0) + (roleDist.viewer || 0);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-7 max-w-6xl mx-auto w-full">

      {/* Greeting */}
      <div className="mb-7">
        <h2 className="text-[11px] uppercase tracking-widest text-white/25 mb-1">
          Welcome back, {session.user.name?.split(" ")[0]}
        </h2>
        <p className="text-[22px] font-light text-white leading-tight">
          Here's what's happening today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-8">
        <StatCard
          label="Total Users"
          value={totalUsers.toLocaleString()}
          sub="All registered accounts"
        />
        <StatCard
          label="New This Week"
          value={newThisWeek}
          sub={`${newThisMonth} this month`}
          color="purple"
        />
        <StatCard
          label="Team Members"
          value={teamCount}
          sub="Admins, mods & viewers"
        />
        <StatCard
          label="Active Accounts"
          value={statusDist.active || 0}
          sub={`${statusDist.suspended || 0} suspended · ${statusDist.banned || 0} banned`}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">

        {/* Recent signups */}
        <div className="lg:col-span-2 bg-[#111] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between">
            <p className="text-[11px] font-semibold text-white/75">Recent Signups</p>
            <a href="/admin/users"
              className="text-[9.5px] uppercase tracking-widest text-white/25
                hover:text-white/55 transition-colors duration-200">
              View all →
            </a>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {recentUsers.map((u) => (
              <div key={u._id} className="flex items-center gap-3 px-5 py-3.5
                hover:bg-white/[0.02] transition-colors duration-150">
                <Image
                  src={
                    u.image ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=7A2267&color=fff&size=64`
                  }
                  alt={u.name}
                  width={28}
                  height={28}
                  className="rounded-full object-cover border border-white/10 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[11.5px] font-medium text-white/80 truncate leading-tight">{u.name}</p>
                  <p className="text-[10px] text-white/28 truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <span className={`hidden sm:inline-flex text-[8px] uppercase tracking-wider
                    font-semibold px-2 py-[3px] rounded-full ${ROLE_STYLES[u.role] || ROLE_STYLES.user}`}>
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[u.status] || "bg-white/20"}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Role distribution */}
        <div className="bg-[#111] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.05]">
            <p className="text-[11px] font-semibold text-white/75">Role Distribution</p>
          </div>
          <div className="px-5 py-4 space-y-3.5">
            {["owner","admin","moderator","viewer","user"].map((role) => {
              const count = roleDist[role] || 0;
              const pct   = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
              return (
                <div key={role}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[8.5px] uppercase tracking-wider font-semibold
                      px-2 py-[3px] rounded-full ${ROLE_STYLES[role]}`}>
                      {ROLE_LABELS[role]}
                    </span>
                    <span className="text-[11px] text-white/50">{count}</span>
                  </div>
                  <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        role === "owner"     ? "bg-amber-400"   :
                        role === "admin"     ? "bg-[#7A2267]"   :
                        role === "moderator" ? "bg-blue-500"    :
                        role === "viewer"    ? "bg-emerald-500" : "bg-white/20"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
