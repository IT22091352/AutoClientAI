import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  plan: {
    type: String,
    enum: ["free", "pro"],
    default: "free",
  },
  freeAccessGranted: {
    type: Boolean,
    default: false,
  },
  whatsappConnected: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

export default mongoose.model("User", userSchema);