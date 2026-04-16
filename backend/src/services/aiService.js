import OpenAI from "openai";
import { getBusinessProfileForUser } from "./businessProfileService.js";

let openaiClient;

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing. Please set it in backend/.env");
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return openaiClient;
}

function buildSystemPrompt(business) {
  const services = business?.services?.length
    ? business.services.join(", ")
    : "No services configured yet";

  const faqText = business?.faqs?.length
    ? business.faqs.map((item, index) => `${index + 1}. ${item}`).join("\n")
    : "No FAQs configured";

  return `You are a sales assistant for ${business?.name || "AutoClient business"}.

Business services: ${services}
Pricing details: ${business?.pricing || "Not configured"}
FAQs:
${faqText}

Rules:
- Keep replies short and natural.
- Be warm, confident, and persuasive.
- Ask one clarifying question when helpful.
- Guide customers toward booking or purchase.
- Never mention that you are an AI model.`;
}

export async function generateReplyForUser({ userId, message }) {
  let business = null;

  if (userId) {
    try {
      business = await getBusinessProfileForUser(userId);
    } catch (error) {
      console.warn("Unable to load business profile:", error.message);
    }
  }

  const openai = getOpenAIClient();

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: buildSystemPrompt(business),
      },
      {
        role: "user",
        content: message,
      },
    ],
  });

  return response.choices[0].message.content;
}

export async function generateReply(message) {
  return generateReplyForUser({ userId: null, message });
}