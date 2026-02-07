import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PAYMENT_METHOD = {
  COD: "COD",
  STRIPE: "STRIPE",
};

export async function POST(request) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    const { addressId, items, paymentMethod, coupon } = await request.json();

    if (
      !addressId ||
      !paymentMethod ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing order details" },
        { status: 400 }
      );
    }

    /* ---------------- GROUP ITEMS BY STORE ---------------- */
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
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    let shippingAdded = false;
    let stripeTotal = 0;

    /* ---------------- CREATE ORDERS ---------------- */
    for (const [storeId, storeItems] of ordersByStore.entries()) {
      let total = storeItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // Apply coupon (already validated)
      if (coupon?.discount) {
        total -= (total * coupon.discount) / 100;
      }

      // Shipping fee once
      if (!shippingAdded) {
        total += 5;
        shippingAdded = true;
      }

      total = Number(total.toFixed(2));
      stripeTotal += total;

      // COD → create order immediately
      if (paymentMethod === PAYMENT_METHOD.COD) {
        await prisma.order.create({
          data: {
            userId,
            storeId,
            addressId,
            total,
            paymentMethod,
            isPaid: false,
            isCouponUsed: !!coupon,
            coupon: coupon || {},
            orderItems: {
              create: storeItems,
            },
          },
        });
      }
    }

    /* ---------------- STRIPE PAYMENT ---------------- */
    if (paymentMethod === PAYMENT_METHOD.STRIPE) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "GoCart Order",
              },
              unit_amount: Math.round(stripeTotal * 100),
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
        metadata: { userId },
      });

      // ✅ FRONTEND EXPECTS `url`
      return NextResponse.json({ url: session.url });
    }

    /* ---------------- CLEAR CART (COD ONLY) ---------------- */
    await prisma.user.update({
      where: { id: userId },
      data: { cart: {} },
    });

    return NextResponse.json(
      { message: "Order placed successfully" },
      { status: 201 }
    );

  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to place order" },
      { status: 500 }
    );
  }
}

/* ================= FETCH ORDERS ================= */
export async function GET(request) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: {
        userId,
        OR: [
          { paymentMethod: PAYMENT_METHOD.COD },
          { paymentMethod: PAYMENT_METHOD.STRIPE, isPaid: true },
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
    console.error("Fetch orders error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
