import express from "express";
import { activateSubscription, createCheckoutSession } from "../controllers/billingController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/create-checkout-session", protect, createCheckoutSession);
router.post("/success", protect, activateSubscription);

export default router;