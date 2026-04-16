import { generateReplyForUser } from "../services/aiService.js";
import Message from "../models/Message.js";
import mongoose from "mongoose";
import { isDBConnected } from "../config/db.js";

export const handleReply = async (req, res) => {
  try {
    const userId = req.userRecord?._id;
    const canPersistMessages = isDBConnected() && mongoose.Types.ObjectId.isValid(String(userId));
    const { message, phone } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!message?.trim()) {
      return res.status(400).json({ error: "message is required" });
    }

    if (canPersistMessages) {
      // Save client message when persistence is available
      await Message.create({
        user: userId,
        sender: "client",
        content: message,
        phone,
        whatsappJid: phone,
      });
    }

    // Generate AI reply
    const reply = await generateReplyForUser({ userId, message, phone });

    if (canPersistMessages) {
      // Save AI reply when persistence is available
      await Message.create({
        user: userId,
        sender: "ai",
        content: reply,
        phone,
        whatsappJid: phone,
      });
    }

    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};