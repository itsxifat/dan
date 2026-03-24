import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Cormorant_Garamond } from "next/font/google";
import { getAccountData } from "@/actions/account/accountActions";
import AccountClient from "@/components/account/AccountClient";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata = { title: "My Account — Dhali's Amber Nivaas" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?redirect=/account");

  const data = await getAccountData(session.user.id);

  return (
    <div className="min-h-screen bg-[#F7F4F0]">
      {/* Hero */}
      <div className="relative bg-[#0f0c0e] pt-28 pb-14 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2a1024]/80 to-[#0f0c0e]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#7A2267]/60 to-transparent" />
        <div className="relative max-w-3xl mx-auto flex items-center gap-5">
          {data.user.image ? (
            <img src={data.user.image} alt={data.user.name} className="w-16 h-16 rounded-full object-cover border-2 border-[#7A2267]/40 shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#7A2267]/20 border-2 border-[#7A2267]/40 flex items-center justify-center shrink-0">
              <span className={`text-[2rem] font-light text-[#D4A8E0] ${cormorant.className}`}>
                {(data.user.name || "?")[0].toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="text-[9px] uppercase tracking-[0.3em] text-[#D4A8E0] font-medium">My Account</p>
            <h1 className={`text-[2rem] sm:text-[2.4rem] font-light text-white leading-tight mt-0.5 ${cormorant.className}`}>
              {data.user.name}
            </h1>
            <p className="text-white/40 text-[12px] mt-0.5">{data.user.email}</p>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-white border-b border-[#EDE5F0]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-8">
          <div className="text-center">
            <p className="text-[1.5rem] font-bold text-[#7A2267]">{data.stats.totalBookings}</p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#9B8BAB] font-semibold">Bookings</p>
          </div>
          <div className="w-px h-10 bg-[#EDE5F0]" />
          <div className="text-center">
            <p className="text-[1.5rem] font-bold text-[#7A2267]">৳{data.stats.totalSpent.toLocaleString()}</p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#9B8BAB] font-semibold">Total Spent</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <AccountClient
          user={data.user}
          bookings={data.bookings}
          userId={session.user.id}
        />
      </div>
    </div>
  );
}
