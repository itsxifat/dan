import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import DayLongPackage from "@/models/DayLongPackage";
import { hasPermission } from "@/lib/permissions";

export async function GET() {
  try {
    await dbConnect();
    const packages = await DayLongPackage.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();
    return NextResponse.json({ packages: JSON.parse(JSON.stringify(packages)) });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch packages." }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !hasPermission(session.user.role, "accommodation.write")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const data = await req.json();
    await dbConnect();
    const pkg = await DayLongPackage.create({ ...data, updatedAt: new Date() });
    return NextResponse.json({ success: true, package: JSON.parse(JSON.stringify(pkg)) });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to create package." }, { status: 500 });
  }
}
