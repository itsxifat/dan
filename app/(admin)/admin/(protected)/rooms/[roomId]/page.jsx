import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getRoomProfile } from "@/actions/accommodation/roomProfileActions";
import RoomDetailEditor from "./RoomDetailEditor";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { roomId } = await params;
  return { title: `Edit Room ${roomId} — Admin` };
}

export default async function AdminRoomDetailPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "accommodation.write")) redirect("/admin/dashboard");

  const { roomId } = await params;
  let room;
  try {
    room = await getRoomProfile(roomId);
  } catch {
    redirect("/admin/rooms");
  }

  return (
    <div className="p-5 sm:p-7 max-w-4xl">
      <div className="mb-6">
        <a href="/admin/rooms"
          className="text-[11px] uppercase tracking-[0.15em] text-white/30 hover:text-white/60 transition-colors flex items-center gap-1.5 mb-4">
          <svg viewBox="0 0 8 14" width="6" height="10" fill="none">
            <path d="M7 1L1 7l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          All Rooms
        </a>
        <h1 className="text-[1.6rem] font-semibold text-white">
          Room #{room.roomNumber}
          <span className="text-white/30 font-normal ml-3 text-[1rem]">Floor {room.floor}</span>
        </h1>
        {room.category && (() => {
          const variant = room.variantId && room.category.variants?.length
            ? room.category.variants.find((v) => String(v._id) === String(room.variantId))
            : null;
          return (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[13px] text-white/40">{room.category.name}</p>
              {variant && (
                <span className="text-[11px] text-[#c05aae]/70 bg-[#7A2267]/15 border border-[#7A2267]/25 px-2.5 py-0.5 rounded-full">
                  {variant.name} · {variant.bedType} · ৳{Number(variant.pricePerNight).toLocaleString()}/night
                </span>
              )}
            </div>
          );
        })()}
      </div>

      <RoomDetailEditor room={room} />
    </div>
  );
}
