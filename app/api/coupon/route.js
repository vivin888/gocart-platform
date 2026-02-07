import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Verify coupon
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "Coupon code is required" },
        { status: 400 }
      );
    }

    // ✅ Find coupon
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: code.toUpperCase(),
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: "Invalid or expired coupon" },
        { status: 404 }
      );
    }

    // 🔓 PUBLIC COUPON → ANYONE
    if (coupon.isPublic === true) {
      return NextResponse.json({ coupon });
    }

    // 🔐 LOGIN REQUIRED
    if (!userId) {
      return NextResponse.json(
        { error: "Login required to use this coupon" },
        { status: 401 }
      );
    }

    // 🆕 NEW USER COUPON
    if (coupon.forNewUser === true) {
      const deliveredOrders = await prisma.order.count({
        where: {
          userId,
          status: "DELIVERED",
        },
      });

      if (deliveredOrders > 0) {
        return NextResponse.json(
          { error: "Coupon valid for new users only" },
          { status: 400 }
        );
      }
    }

    // 👤 MEMBER-ONLY COUPON
    // ✅ MEMBER = LOGGED-IN USER (FIXED)
    if (coupon.forMember === true && !userId) {
      return NextResponse.json(
        { error: "Coupon valid for members only" },
        { status: 400 }
      );
    }

    // ✅ SUCCESS
    return NextResponse.json({ coupon });

  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}
