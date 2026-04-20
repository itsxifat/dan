import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { ADMIN_ROLES } from "@/models/User";

export async function GET(request, { params }) {
  await dbConnect();

  const adminCount = await User.countDocuments({ role: { $in: ADMIN_ROLES } });

  if (adminCount > 0) {
    return NextResponse.json(
      { success: false, message: "Admin already exists. This route is disabled." },
      { status: 403 }
    );
  }

  const { email } = await params;
  const decoded = decodeURIComponent(email).toLowerCase().trim();

  const user = await User.findOne({ email: decoded });

  if (!user) {
    return NextResponse.json(
      { success: false, message: "No account found with that email. Register first." },
      { status: 404 }
    );
  }

  await User.findByIdAndUpdate(user._id, { role: "owner" });

  return NextResponse.json({
    success: true,
    message: `${user.name} (${decoded}) is now the owner. This route is now permanently disabled.`,
  });
}
