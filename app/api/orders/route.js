import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const PAYMENT_METHOD = {
  COD: "COD",
  STRIPE: "STRIPE",
};

export async function POST(request) {
  try {
    const { userId, has } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    const {
      addressId,
      items,
      couponCode,
      paymentMethod: selectedPaymentMethod,
    } = await request.json();

    if (
      !addressId ||
      !selectedPaymentMethod ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        { error: "missing order details." },
        { status: 401 }
      );
    }

    let coupon = null;

    if (couponCode) {
      coupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
      });

      if (!coupon) {
        return NextResponse.json(
          { error: "Coupon not found" },
          { status: 400 }
        );
      }
    }

    if (couponCode && coupon?.forNewUser) {
      const userOrders = await prisma.order.findMany({ where: { userId } });
      if (userOrders.length > 0) {
        return NextResponse.json(
          { error: "Coupon valid for new users" },
          { status: 400 }
        );
      }
    }

    const isPlusMember = has({ plan: "plus" });

    if (couponCode && coupon?.forMember && !isPlusMember) {
      return NextResponse.json(
        { error: "Coupon valid for members only" },
        { status: 400 }
      );
    }

    const ordersByStore = new Map();

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.id },
      });

      const storeId = product.storeId;
      if (!ordersByStore.has(storeId)) {
        ordersByStore.set(storeId, []);
      }

      ordersByStore.get(storeId).push({
        ...item,
        price: product.price,
      });
    }

    let isShippingFeeAdded = false;

    for (const [storeId, sellerItems] of ordersByStore.entries()) {
      let total = sellerItems.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );

      if (coupon) {
        total -= (total * coupon.discount) / 100;
      }

      if (!isPlusMember && !isShippingFeeAdded) {
        total += 5;
        isShippingFeeAdded = true;
      }

      await prisma.order.create({
        data: {
          userId,
          storeId,
          addressId,
          total: parseFloat(total.toFixed(2)),
          paymentMethod: selectedPaymentMethod,
          isCouponUsed: !!coupon,
          orderItems: {
            create: sellerItems.map((item) => ({
              productId: item.id,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { cart: {} },
    });

    return NextResponse.json({ message: "Orders Placed Successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: {
        userId,
        OR: [
          { paymentMethod: PAYMENT_METHOD.COD },
          {
            AND: [
              { paymentMethod: PAYMENT_METHOD.STRIPE },
              { isPaid: true },
            ],
          },
        ],
      },
      include: {
        orderItems: { include: { product: true } },
        address: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}
