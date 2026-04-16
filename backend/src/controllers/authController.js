import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { isDBConnected } from "../config/db.js";
import { countLocalUsers, findLocalUserByEmail, upsertLocalUser } from "../config/localStore.js";
import { randomUUID } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "secretkey";
const FREE_ACCESS_LIMIT = Number(process.env.FREE_ACCESS_LIMIT || 100);

const hasAutomationAccess = (user) => user.plan === "pro" || user.freeAccessGranted !== false;

const buildUserPayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  plan: user.plan,
  freeAccessGranted: user.freeAccessGranted !== false,
  whatsappConnected: Boolean(user.whatsappConnected),
  canUseAutomation: hasAutomationAccess(user),
});

const signToken = (userId) => jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" });

const createLocalUserRecord = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  password: user.password,
  plan: user.plan || "free",
  freeAccessGranted: user.freeAccessGranted !== false,
  whatsappConnected: Boolean(user.whatsappConnected),
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

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    if (!name || !email || !password) {
      return res.status(400).json({ msg: "Name, email, and password are required" });
    }

    if (isDBConnected()) {
      const existing = await User.findOne({ email: normalizedEmail });

      if (existing) {
        return res.status(400).json({ msg: "Email already registered" });
      }

      const hashed = await bcrypt.hash(password, 10);

      const userCount = await User.countDocuments();
      const freeAccessGranted = userCount < FREE_ACCESS_LIMIT;

      const user = await User.create({
        name,
        email: normalizedEmail,
        password: hashed,
        freeAccessGranted,
      });

      const token = signToken(user._id);

      return res.json({
        token,
        userId: user._id,
        user: buildUserPayload(user),
      });
    }

    const existing = await findLocalUserByEmail(normalizedEmail);

    if (existing) {
      return res.status(400).json({ msg: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const userCount = await countLocalUsers();
    const freeAccessGranted = userCount < FREE_ACCESS_LIMIT;

    const user = createLocalUserRecord({
      _id: randomUUID(),
      name,
      email: normalizedEmail,
      password: hashed,
      plan: "free",
      freeAccessGranted,
      whatsappConnected: false,
    });

    await user.save();

    const token = signToken(user._id);

    res.json({
      token,
      userId: user._id,
      user: buildUserPayload(user),
    });
  } catch (error) {
    console.error("register error:", error.message);
    res.status(500).json({ msg: "Unable to register right now." });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    if (isDBConnected()) {
      const user = await User.findOne({ email: normalizedEmail }).select("+password");

      if (user) {
        const valid = await bcrypt.compare(password, user.password);

        if (!valid) return res.status(400).json({ msg: "Wrong password" });

        const token = signToken(user._id);

        return res.json({
          token,
          userId: user._id,
          user: buildUserPayload(user),
        });
      }
    }

    const user = await findLocalUserByEmail(normalizedEmail);

    if (!user) return res.status(400).json({ msg: "User not found" });

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) return res.status(400).json({ msg: "Wrong password" });

    const token = signToken(user._id);

    res.json({
      token,
      userId: user._id,
      user: buildUserPayload(user),
    });
  } catch (error) {
    console.error("login error:", error.message);
    res.status(500).json({ msg: "Unable to login right now." });
  }
};

export const me = async (req, res) => {
  res.json({ user: buildUserPayload(req.userRecord) });
};