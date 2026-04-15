import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect, notFound } from "next/navigation";
import {
  getRoomFullDetail,
  getRoomHistory,
  getRoomLog,
  getOfflineBookingsByRoom,
} from "@/actions/admin/roomManagementActions";
import PageHeader from "@/components/admin/PageHeader";
import RoomDetailClient from "./RoomDetailClient";
import Link from "next/link";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { roomId } = await params;
  const detail = await getRoomFullDetail(roomId).catch(() => null);
  return { title: `Room ${detail?.room?.roomNumber || roomId} — Admin` };
}

export default async function RoomDetailPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "bookings.read")) redirect("/admin/dashboard");

  const { roomId } = await params;
  const canWrite = hasPermission(session.user.role, "bookings.write");

  const [detail, { history }, { logs }, offlineBookings] = await Promise.all([
    getRoomFullDetail(roomId),
    getRoomHistory(roomId, { page: 1, limit: 30 }),
    getRoomLog(roomId, { page: 1, limit: 50 }),
    getOfflineBookingsByRoom(roomId),
  ]);

  if (!detail) notFound();

  const { room, currentOnline, currentOffline, nextOnline, nextOffline, hasConflict } = detail;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title={`Room ${room.roomNumber}`}
        subtitle={`${room.property?.name || ""} · ${room.category?.name || ""} · Floor ${room.floor}`}
        action={
          <Link
            href="/admin/rooms"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px]
              text-white/50 hover:text-white/80 border border-white/[0.07]
              hover:bg-white/[0.04] transition-all duration-200"
          >
            <svg viewBox="0 0 14 14" width="12" height="12" fill="none">
              <path d="M8.5 2.5L4 7l4.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            All Rooms
          </Link>
        }
      />

      <Suspense fallback={null}>
        <RoomDetailClient
          room={room}
          currentOnline={currentOnline}
          currentOffline={currentOffline}
          nextOnline={nextOnline}
          nextOffline={nextOffline}
          hasConflict={hasConflict}
          history={history}
          logs={logs}
          offlineBookings={offlineBookings}
          canWrite={canWrite}
        />
      </Suspense>
    </div>
  );
}
