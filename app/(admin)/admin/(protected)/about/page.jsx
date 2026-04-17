import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getAboutPage } from "@/actions/about/aboutActions";
import AboutPageManager from "./AboutPageManager";
import PageHeader from "@/components/admin/PageHeader";

export const metadata = { title: "About Page — Admin" };
export const dynamic  = "force-dynamic";

export default async function AboutAdminPage() {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "settings.write")) redirect("/admin/dashboard");

  const data = await getAboutPage();

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="About Page"
        subtitle="Manage the Chairman's message, photo, and details"
      />
      <AboutPageManager data={data} />
    </div>
  );
}
