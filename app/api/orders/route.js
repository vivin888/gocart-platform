import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Stripe from "stripe";

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
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        { error: "missing order details" },
        { status: 400 }
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

    if (coupon?.forNewUser) {
      const userOrders = await prisma.order.count({ where: { userId } });
      if (userOrders > 0) {
        return NextResponse.json(
          { error: "Coupon valid for new users only" },
          { status: 400 }
        );
      }
    }

    const isPlusMember = has({ plan: "plus" });

    if (coupon?.forMember && !isPlusMember) {
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

      if (!product) continue;

      if (!ordersByStore.has(product.storeId)) {
        ordersByStore.set(product.storeId, []);
      }

      ordersByStore.get(product.storeId).push({
        ...item,
        price: product.price,
      });
    }

    let isShippingFeeAdded = false;
    const orderIds = [];
    let fullAmount = 0;

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

      total = parseFloat(total.toFixed(2));
      fullAmount += total;

      const order = await prisma.order.create({
        data: {
          userId,
          storeId,
          addressId,
          total,
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

      orderIds.push(order.id);
    }

    if (selectedPaymentMethod === PAYMENT_METHOD.STRIPE) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const origin = request.headers.get("origin");

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: { name: "Order" },
              unit_amount: Math.round(fullAmount * 100),
            },
            quantity: 1,
          },
        ],
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        mode: "payment",
        success_url: `${origin}/loading?nextUrl=orders`,
        cancel_url: `${origin}/cart`,
        metadata: {
          orderIds: orderIds.join(","),
          userId,
          appId: "gocart",
        },
      });

      return NextResponse.json({ session });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { cart: {} },
    });

    return NextResponse.json({ message: "Orders placed successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
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
      { error: error.message || "Something went wrong" },
      { status: 400 }
    );
  }
}
