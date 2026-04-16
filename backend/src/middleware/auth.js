import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";
import { isDBConnected } from "../config/db.js";
import { findLocalUserById, upsertLocalUser } from "../config/localStore.js";

const JWT_SECRET = process.env.JWT_SECRET || "secretkey";
const hasAutomationAccess = (user) => user.plan === "pro" || user.freeAccessGranted !== false;

const toLocalUserRecord = (localUser) => ({
  ...localUser,
  async save() {
    await upsertLocalUser({
      _id: this._id,
      name: this.name,
      email: this.email,
      password: this.password,
      plan: this.plan,
      freeAccessGranted: this.freeAccessGranted,
      whatsappConnected: this.whatsappConnected,
    });

    return this;
  },
});

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  if (!token) return res.status(401).json({ msg: "No token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (isDBConnected() && mongoose.Types.ObjectId.isValid(decoded.id)) {
      const user = await User.findById(decoded.id).select("-password");

      if (user) {
        req.user = decoded;
        req.userRecord = user;
        return next();
      }
    }

    const localUser = await findLocalUserById(decoded.id);

    if (!localUser) {
      return res.status(401).json({ msg: "User not found" });
    }

    req.user = decoded;
    req.userRecord = toLocalUserRecord(localUser);
    next();
  } catch (error) {
    res.status(401).json({ msg: "Invalid token" });
  }
};

export const requirePro = (req, res, next) => {
  if (req.userRecord?.plan !== "pro") {
    return res.status(403).json({ msg: "Upgrade to Pro to access this feature." });
  }

  next();
};

export const requireFeatureAccess = (req, res, next) => {
  if (!hasAutomationAccess(req.userRecord)) {
    return res.status(403).json({
      msg: "Free access limit reached. Please upgrade to Pro to continue using this feature.",
    });
  }

  next();
};