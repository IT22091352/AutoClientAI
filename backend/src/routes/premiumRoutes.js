import express from "express";
import { getPremiumInsights } from "../controllers/premiumController.js";
import { protect, requirePro } from "../middleware/auth.js";

const router = express.Router();

router.get("/insights", protect, requirePro, getPremiumInsights);

export default router;