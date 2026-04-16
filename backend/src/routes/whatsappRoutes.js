import express from "express";
import { generateQr, getWhatsAppStatus } from "../controllers/whatsappController.js";
import { protect, requireFeatureAccess } from "../middleware/auth.js";

const router = express.Router();

router.get("/status", protect, requireFeatureAccess, getWhatsAppStatus);
router.post("/generate-qr", protect, requireFeatureAccess, generateQr);

export default router;
