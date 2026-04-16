import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import { generateReply } from "../services/aiService.js";
import Message from "../models/Message.js";
import { isDBConnected } from "../config/db.js";
import qrcode from "qrcode-terminal";

export async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");

  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    browser: ["Windows", "Chrome", "120.0"],
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, qr, lastDisconnect } = update;

    // ✅ FORCE QR PRINT
    if (qr) {
      console.log("\n📱 SCAN THIS QR CODE:\n");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      console.log("✅ WhatsApp Connected!");
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;

      console.log("❌ Connection closed. Reconnecting:", shouldReconnect);

      if (shouldReconnect) {
        setTimeout(() => {
          startWhatsApp();
        }, 3000);
      }
    }
  });

  // ✅ MESSAGE LISTENER
  sock.ev.on("messages.upsert", async ({ messages }) => {
  try {
    const msg = messages[0];

    // 🚨 VERY IMPORTANT
    if (msg.key.fromMe) return;

    if (!msg.message) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text;

    if (!text) return;

    const from = msg.key.remoteJid;

    console.log("📩 Message:", text);

    // (DB save optional)
    try {
      await Message.create({
        sender: "client",
        content: text,
        phone: from,
      });
    } catch {}

    const reply = await generateReply(text);

    console.log("🤖 Reply:", reply);

    await sock.sendMessage(from, { text: reply });

  } catch (err) {
    console.error("Error:", err);
  }
});

  console.log("🚀 WhatsApp bot starting...");
}