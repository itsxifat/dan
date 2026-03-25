import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import DayLongPackage from "@/models/DayLongPackage";
import { hasPermission } from "@/lib/permissions";

async function requireWrite() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasPermission(session.user.role, "accommodation.write")) {
    throw new Error("Unauthorized");
  }
}

export async function PUT(req, { params }) {
  try {
    await requireWrite();
    const { id } = await params;
    const data   = await req.json();
    await dbConnect();
    await DayLongPackage.findByIdAndUpdate(id, { ...data, updatedAt: new Date() });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.message === "Unauthorized" ? 403 : 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await requireWrite();
    const { id } = await params;
    await dbConnect();
    await DayLongPackage.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.message === "Unauthorized" ? 403 : 500 });
  }
}
