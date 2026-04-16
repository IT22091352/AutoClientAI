import mongoose from "mongoose";

const businessSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  services: {
    type: [String],
    default: [],
  },
  pricing: {
    type: String,
    default: "",
  },
  faqs: {
    type: [String],
    default: [],
  },
}, {
  timestamps: true,
});

export default mongoose.model("Business", businessSchema);