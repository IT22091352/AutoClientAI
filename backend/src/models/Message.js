import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  sender: {
    type: String, // "client" | "ai"
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
  },
  whatsappJid: {
    type: String,
  },
  metadata: {
    type: Object,
    default: {},
  },
}, {
  timestamps: true,
});

export default mongoose.model("Message", messageSchema);