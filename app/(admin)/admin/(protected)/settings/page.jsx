import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getSettings } from "@/actions/accommodation/settingsActions";
import SettingsForm from "./SettingsForm";
import PageHeader from "@/components/admin/PageHeader";

export const metadata = { title: "Settings — Admin" };
export const dynamic  = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "settings.write")) redirect("/admin/dashboard");

  const settings = await getSettings();

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Hotel-wide configuration applied to all bookings and pages"
      />
      <SettingsForm settings={settings} />
    </div>
  );
}
