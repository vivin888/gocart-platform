import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Approve / Reject Seller
export async function POST(request) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { storeId, status } = await request.json();

    if (!storeId || !status) {
      return NextResponse.json(
        { error: "storeId and status are required" },
        { status: 400 }
      );
    }

    if (status === "approved") {
      await prisma.store.update({
        where: { id: storeId },
        data: {
          status: "approved",
          isActive: true,
        },
      });
    } else if (status === "rejected") {
      await prisma.store.update({
        where: { id: storeId },
        data: {
          status: "rejected",
          isActive: false,
        },
      });
    } else {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: `Store ${status} successfully`,
    });
  } catch (error) {
    console.error("POST approve-store error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get all pending & rejected stores
export async function GET(request) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", stores: [] },
        { status: 401 }
      );
    }

    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden", stores: [] },
        { status: 403 }
      );
    }

    const stores = await prisma.store.findMany({
      where: {
        status: { in: ["pending", "rejected"] },
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json({ stores });
  } catch (error) {
    console.error("GET approve-store error:", error);
    return NextResponse.json(
      { error: "Internal server error", stores: [] },
      { status: 500 }
    );
  }
}
