import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import aiRoutes from "./routes/aiRoutes.js";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import billingRoutes from "./routes/billingRoutes.js";
import premiumRoutes from "./routes/premiumRoutes.js";
import whatsappRoutes from "./routes/whatsappRoutes.js";
import businessRoutes from "./routes/businessRoutes.js";
import { pathToFileURL } from "url";

dotenv.config();

const app = express();

// connect DB
connectDB();

const normalizeOrigin = (value) => value.trim().replace(/\/$/, "");

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000,http://localhost:5173")
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      const normalizedOrigin = origin ? normalizeOrigin(origin) : origin;

      if (!origin || allowedOrigins.includes(normalizedOrigin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/premium", premiumRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/business", businessRoutes);
app.use("/api", aiRoutes);

app.get("/", (req, res) => {
  res.send("AutoClient AI running 🚀");
});

const PORT = process.env.PORT || 5000;
const isMainModule = process.argv[1]
  ? pathToFileURL(process.argv[1]).href === import.meta.url
  : false;

if (isMainModule && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;