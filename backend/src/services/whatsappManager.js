import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import path from "path";
import { mkdir } from "fs/promises";
import mongoose from "mongoose";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { isDBConnected } from "../config/db.js";
import { generateReplyForUser } from "./aiService.js";

const userSessions = new Map();
const authRoot = path.resolve(process.cwd(), "auth", "users");

function emptyStatus(userId) {
  return {
    userId,
    status: "disconnected",
    connected: false,
    qrCodeDataUrl: null,
    lastError: null,
    updatedAt: null,
  };
}

function extractMessageText(message) {
  if (!message) return "";

  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    ""
  );
}

async function markUserConnection(userId, connected) {
  if (!isDBConnected() || !mongoose.Types.ObjectId.isValid(userId)) return;

  try {
    await User.updateOne(
      { _id: userId },
      { $set: { whatsappConnected: connected } }
    );
  } catch (error) {
    console.warn("Unable to update WhatsApp connection state:", error.message);
  }
}

async function ensureAuthRoot() {
  await mkdir(authRoot, { recursive: true });
}

export async function ensureUserSession(userId, options = {}) {
  const { forceNew = false } = options;
  const normalizedUserId = userId.toString();
  const canPersistMessages = isDBConnected() && mongoose.Types.ObjectId.isValid(normalizedUserId);

  const existing = userSessions.get(normalizedUserId);
  if (existing && !forceNew && ["connecting", "connected", "qr", "reconnecting"].includes(existing.status)) {
    return existing;
  }

  await ensureAuthRoot();

  const authFolder = path.join(authRoot, normalizedUserId);
  const { state, saveCreds } = await useMultiFileAuthState(authFolder);
  const { version } = await fetchLatestBaileysVersion();

  const session = existing || emptyStatus(normalizedUserId);
  session.status = "connecting";
  session.connected = false;
  session.lastError = null;
  session.updatedAt = new Date().toISOString();
  userSessions.set(normalizedUserId, session);

  const sock = makeWASocket({
    version,
    auth: state,
    browser: ["AutoClient", "Chrome", "120.0"],
    printQRInTerminal: false,
  });

  session.sock = sock;

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, qr, lastDisconnect } = update;

    if (qr) {
      session.status = "qr";
      session.connected = false;
      session.qrCodeDataUrl = await QRCode.toDataURL(qr, { width: 280, margin: 1 });
      session.updatedAt = new Date().toISOString();
    }

    if (connection === "open") {
      session.status = "connected";
      session.connected = true;
      session.qrCodeDataUrl = null;
      session.lastError = null;
      session.updatedAt = new Date().toISOString();
      await markUserConnection(normalizedUserId, true);
    }

    if (connection === "close") {
      session.connected = false;
      session.status = "disconnected";
      session.updatedAt = new Date().toISOString();
      await markUserConnection(normalizedUserId, false);

      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      session.lastError = lastDisconnect?.error?.message || null;

      if (shouldReconnect) {
        session.status = "reconnecting";

        setTimeout(() => {
          ensureUserSession(normalizedUserId, { forceNew: true }).catch((error) => {
            console.error("WhatsApp reconnect failed:", error.message);
          });
        }, 2500);
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    try {
      const msg = messages?.[0];
      if (!msg || msg.key?.fromMe || !msg.message) return;

      const text = extractMessageText(msg.message);
      if (!text) return;

      const from = msg.key.remoteJid || "unknown";

      if (canPersistMessages) {
        await Message.create({
          user: normalizedUserId,
          sender: "client",
          content: text,
          phone: from,
          whatsappJid: from,
        });
      }

      const reply = await generateReplyForUser({
        userId: normalizedUserId,
        message: text,
        phone: from,
      });

      await sock.sendMessage(from, { text: reply });

      if (canPersistMessages) {
        await Message.create({
          user: normalizedUserId,
          sender: "ai",
          content: reply,
          phone: from,
          whatsappJid: from,
        });
      }
    } catch (error) {
      console.error("WhatsApp upsert handler error:", error.message);
    }
  });

  return session;
}

export function getUserSessionStatus(userId) {
  const normalizedUserId = userId.toString();
  const session = userSessions.get(normalizedUserId);

  if (!session) {
    return emptyStatus(normalizedUserId);
  }

  return {
    userId: normalizedUserId,
    status: session.status,
    connected: Boolean(session.connected),
    qrCodeDataUrl: session.qrCodeDataUrl || null,
    lastError: session.lastError || null,
    updatedAt: session.updatedAt || null,
  };
}
