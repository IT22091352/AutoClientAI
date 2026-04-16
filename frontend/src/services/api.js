import axios from "axios";

const rawApiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
const normalizedApiBaseUrl = rawApiBaseUrl.endsWith("/api")
  ? rawApiBaseUrl
  : `${rawApiBaseUrl}/api`;

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