import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").trim().replace(/\/$/, "");
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
const demoSubscriptionMode = process.env.DEMO_SUBSCRIPTION_MODE === "true" || !stripe;

const buildUserPayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  plan: user.plan,
});

export const createCheckoutSession = async (req, res) => {
  if (demoSubscriptionMode) {
    return res.json({
      checkoutUrl: `${frontendUrl}/success?session_id=demo-${req.userRecord._id.toString()}`,
      demo: true,
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: req.userRecord.email,
    client_reference_id: req.userRecord._id.toString(),
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "AutoClient AI Pro",
            description: "Unlock premium AI automation and subscription features",
          },
          unit_amount: 1000,
          recurring: {
            interval: "month",
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${frontendUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl}/dashboard`,
    metadata: {
      userId: req.userRecord._id.toString(),
    },
  });

  res.json({ checkoutUrl: session.url });
};

export const activateSubscription = async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ msg: "sessionId is required" });
  }

  if (demoSubscriptionMode && sessionId.startsWith("demo-")) {
    req.userRecord.plan = "pro";
    await req.userRecord.save();

    return res.json({
      message: "Plan Activated",
      demo: true,
      user: buildUserPayload(req.userRecord),
    });
  }

  if (!stripe) {
    return res.status(500).json({ msg: "STRIPE_SECRET_KEY is missing" });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const sessionOwnerId = session.metadata?.userId || session.client_reference_id;

  if (sessionOwnerId !== req.userRecord._id.toString()) {
    return res.status(403).json({ msg: "Session does not belong to this user" });
  }

  if (session.payment_status !== "paid" && session.status !== "complete") {
    return res.status(400).json({ msg: "Payment has not been completed" });
  }

  req.userRecord.plan = "pro";
  await req.userRecord.save();

  res.json({
    message: "Plan Activated",
    user: buildUserPayload(req.userRecord),
  });
};