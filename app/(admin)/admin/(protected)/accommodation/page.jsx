import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getProperties } from "@/actions/accommodation/propertyActions";
import PropertiesList from "./PropertiesList";

export const metadata = { title: "Accommodation — Admin" };
export const dynamic = "force-dynamic";

export default async function AccommodationPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "accommodation.read")) redirect("/admin/dashboard");

  const params = await searchParams;
  const page   = Math.max(1, parseInt(params?.page || "1"));
  const type   = params?.type   || "";
  const search = params?.search || "";

  const canWrite = hasPermission(session.user.role, "accommodation.write");

  const { properties, total, pages } = await getProperties({ page, limit: 12, type, search });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[18px] font-semibold text-white/85">Properties</h2>
          <p className="text-[11px] text-white/30 mt-0.5">{total} total · Buildings & Cottages</p>
        </div>
        {canWrite && (
          <Link
            href="/admin/accommodation/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7A2267] text-white text-[12.5px]
              font-semibold hover:bg-[#8e2878] transition-colors duration-200"
          >
            <svg viewBox="0 0 14 14" width="11" height="11" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            New Property
          </Link>
        )}
      </div>

      <PropertiesList
        initialProperties={properties}
        total={total}
        pages={pages}
        currentPage={page}
        currentType={type}
        currentSearch={search}
        canWrite={canWrite}
      />
    </div>
  );
}
