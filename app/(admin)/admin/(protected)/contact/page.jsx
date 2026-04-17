import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getContactInfo, getContactMessages } from "@/actions/contact/contactActions";
import ContactManager from "./ContactManager";
import PageHeader from "@/components/admin/PageHeader";

export const metadata = { title: "Contact — Admin" };
export const dynamic  = "force-dynamic";

export default async function ContactAdminPage() {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "settings.write")) redirect("/admin/dashboard");

  const [info, { messages, total }] = await Promise.all([
    getContactInfo(),
    getContactMessages({ limit: 50 }),
  ]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Contact"
        subtitle="Manage contact information, map location, and received messages"
        count={total > 0 ? `${total} message${total !== 1 ? "s" : ""}` : undefined}
      />
      <ContactManager
        info={info}
        initialMessages={messages}
        totalMessages={total}
        mapsApiKey={process.env.GOOGLE_MAPS_EMBED_API_KEY || ""}
      />
    </div>
  );
}
