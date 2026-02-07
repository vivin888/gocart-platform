import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);

    // Not logged in → not admin (but still 200)
    if (!userId) {
      return NextResponse.json({ isAdmin: false });
    }

    const isAdmin = await authAdmin(userId);

    // ✅ ALWAYS return 200
    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error("is-admin API error:", error);

    // ✅ STILL return 200
    return NextResponse.json({ isAdmin: false });
  }
}
