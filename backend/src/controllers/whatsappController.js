import { ensureUserSession, getUserSessionStatus } from "../services/whatsappManager.js";
import {
  getBusinessProfileForUser,
  isBusinessProfileComplete,
} from "../services/businessProfileService.js";

export const generateQr = async (req, res) => {
  const userId = req.userRecord._id.toString();

  try {
    const business = await getBusinessProfileForUser(req.userRecord._id);

    if (!isBusinessProfileComplete(business)) {
      return res.status(400).json({
        msg: "Please complete business details first",
      });
    }

    await ensureUserSession(userId);
    const status = getUserSessionStatus(userId);

    return res.json({
      message: status.qrCodeDataUrl
        ? "QR generated. Scan it from WhatsApp linked devices."
        : "Session initializing. Please refresh status in a moment.",
      whatsapp: status,
    });
  } catch (error) {
    return res.status(500).json({
      msg: "Unable to initialize WhatsApp session",
      error: error.message,
    });
  }
};

export const getWhatsAppStatus = async (req, res) => {
  const userId = req.userRecord._id.toString();
  const status = getUserSessionStatus(userId);

  return res.json({ whatsapp: status });
};
