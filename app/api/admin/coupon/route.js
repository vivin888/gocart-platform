import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Add new coupon
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);

    if (!isAdmin) {
      return NextResponse.json(
        { error: "not authorized" },
        { status: 401 }
      );
    }

    const { coupon } = await request.json();
    coupon.code = coupon.code.toUpperCase();
    const existingCoupon = await prisma.coupon.findUnique({
    where: { code: coupon.code },
    })

    if (existingCoupon) {
    return new Response(
        JSON.stringify({ message: "Coupon code already exists" }),
        { status: 409 }
    )
    }

    const createdCoupon = await prisma.coupon.create({
    data: coupon,
    })


    return NextResponse.json({ message: "Coupon created successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {  error : error.code ||error.message },
      { status: 400 }
    );
  }
}
//Delete coupon
export async function DELETE(request) {
    try {
        const { userId } = getAuth(request);
        const isAdmin = await authAdmin(userId);

        if (!isAdmin) {
        return NextResponse.json(
            { error: "not authorized" },
            { status: 401 }
        );
        }

        const { searchParams } = request.nextUrl;
        const code = searchParams.get("code");
        await prisma.coupon.delete({ where: { code } });

        return NextResponse.json({
        message: "Coupon deleted successfully",
        });
    } catch (error) {
    console.error(error);
    return NextResponse.json(
        { error: error.code || error.message },
        { status: 400 }
    );
    }
}

//get all coupons
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);

    if (!isAdmin) {
      return NextResponse.json(
        { error: "not authorized" },
        { status: 401 }
      );
    }

    const coupons = await prisma.coupon.findMany({});
    return NextResponse.json({ coupons });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}
