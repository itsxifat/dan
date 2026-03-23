import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getSettings } from "@/actions/accommodation/settingsActions";
import SettingsForm from "./SettingsForm";

export const metadata = { title: "Settings — Admin" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "settings.write")) redirect("/admin/dashboard");

  const settings = await getSettings();

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h2 className="text-[18px] font-semibold text-white/85">Settings</h2>
        <p className="text-[11px] text-white/30 mt-0.5">Hotel-wide configuration applied to all bookings.</p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}
