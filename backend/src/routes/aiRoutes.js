import express from "express";
import { handleReply } from "../controllers/aiController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/reply", protect, handleReply);

export default router;