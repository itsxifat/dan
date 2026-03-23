import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import PropertyForm from "@/components/admin/accommodation/PropertyForm";

export const metadata = { title: "New Property — Admin" };

export default async function NewPropertyPage() {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "accommodation.write")) redirect("/admin/accommodation");

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h2 className="text-[18px] font-semibold text-white/85">New Property</h2>
        <p className="text-[11px] text-white/30 mt-0.5">Add a building or cottage to the accommodation catalogue.</p>
      </div>
      <PropertyForm />
    </div>
  );
}
