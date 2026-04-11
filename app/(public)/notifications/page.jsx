import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserNotifications } from "@/actions/notifications/notificationActions";
import NotificationsClient from "./NotificationsClient";
import { Cormorant_Garamond, Montserrat } from "next/font/google";

const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500"], style: ["normal", "italic"] });
const sans = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600"] });

export const dynamic = "force-dynamic";
export const metadata = { title: "Notifications — Dhali's Amber Nivaas" };

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/notifications");

  const { notifications, unreadCount } = await getUserNotifications();

  return (
    <div className="min-h-screen bg-[#F7F4F0]">
      {/* Header */}
      <div className="relative bg-[#0f0a0d] pt-32 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#3d0a30_0%,_transparent_60%)]" />
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#c9a96e]/70 to-transparent" />
        <div className="relative max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-[#c9a96e]/50" />
            <p className={`${sans.className} text-[9px] uppercase tracking-[0.38em] text-[#c9a96e] font-semibold`}>
              Your Updates
            </p>
            <div className="h-px w-8 bg-[#c9a96e]/50" />
          </div>
          <h1 className={`text-[2.4rem] font-light text-white leading-tight ${cormorant.className}`}>
            Notifications
          </h1>
          {unreadCount > 0 && (
            <p className={`${sans.className} mt-3 text-[12px] text-[#c9a96e]/70`}>
              {unreadCount} unread message{unreadCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10 -mt-4">
        <NotificationsClient
          initialNotifications={notifications}
          initialUnreadCount={unreadCount}
        />
      </div>
    </div>
  );
}
