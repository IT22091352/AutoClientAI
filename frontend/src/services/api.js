import axios from "axios";

const isLocalDev = Boolean(
  ["localhost", "127.0.0.1"].includes(window.location.hostname)
);

const configuredApiBaseUrl = import.meta.env.VITE_API_URL;
const fallbackProductionApiBaseUrl = "https://auto-client-ai-5ohg.vercel.app";
const hasValidConfiguredApiBaseUrl =
  configuredApiBaseUrl && !configuredApiBaseUrl.includes("your-backend-url.com");

const stripTrailingSlash = (value) => value.replace(/\/+$/, "");

const rawApiBaseUrl = isLocalDev
  ? "http://localhost:5000"
  : hasValidConfiguredApiBaseUrl
    ? configuredApiBaseUrl
    : fallbackProductionApiBaseUrl;

const sanitizedApiBaseUrl = rawApiBaseUrl ? stripTrailingSlash(rawApiBaseUrl) : "";

const normalizedApiBaseUrl = sanitizedApiBaseUrl
  ? sanitizedApiBaseUrl.endsWith("/api")
    ? sanitizedApiBaseUrl
    : `${sanitizedApiBaseUrl}/api`
  : "/api";

const API = axios.create({
  baseURL: normalizedApiBaseUrl,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const loginUser = (credentials) => API.post("/auth/login", credentials);

export const signupUser = (payload) => API.post("/auth/register", payload);

export const getCurrentUser = () => API.get("/auth/me");

export const createCheckoutSession = () => API.post("/billing/create-checkout-session");

export const confirmSubscription = (sessionId) =>
  API.post("/billing/success", { sessionId });

export const getPremiumInsights = () => API.get("/premium/insights");

export const getBusinessProfile = () => API.get("/business/me");

export const saveBusinessProfile = (payload) => API.put("/business/me", payload);

export const saveBusinessDetails = (payload) => API.post("/business/save", payload);

export const updateBusinessDetails = (payload) => API.put("/business/update", payload);

export const getWhatsAppStatus = () => API.get("/whatsapp/status");

export const generateWhatsAppQr = () => API.post("/whatsapp/generate-qr");

export const sendMessage = (message) => {
  return API.post("/reply", {
    message,
    phone: "demo-user",
  });
};