import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getLegalDocument } from "@/actions/legal/legalActions";
import PrivacyManager from "./PrivacyManager";
import PageHeader from "@/components/admin/PageHeader";
import Link from "next/link";

export const metadata = { title: "Privacy Policy — Admin" };
export const dynamic  = "force-dynamic";

export default async function PrivacyAdminPage() {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "settings.write")) redirect("/admin/dashboard");

  const data = await getLegalDocument("privacy");

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Privacy Policy"
        subtitle="Manage the public Privacy Policy document"
        action={
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider
              px-4 py-2 rounded-xl border border-white/[0.1] text-white/40
              hover:bg-white/[0.05] hover:text-white/70 transition-all duration-200"
          >
            <svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <path d="M6 2H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8M8 2h4v4M12 2L6.5 7.5" />
            </svg>
            View Live
          </Link>
        }
      />
      <PrivacyManager data={data} />
    </div>
  );
}
