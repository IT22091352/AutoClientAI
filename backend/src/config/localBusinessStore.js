import { mkdir, readFile, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = process.env.VERCEL
  ? path.join(os.tmpdir(), "autoclient-ai", "data")
  : path.resolve(__dirname, "../data");
const businessFile = path.join(dataDir, "business.json");

async function ensureStore() {
  await mkdir(dataDir, { recursive: true });
}

async function readJson(filePath, fallback) {
  try {
    const content = await readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, value) {
  await ensureStore();
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

export async function getLocalBusinesses() {
  return readJson(businessFile, []);
}

export async function saveLocalBusinesses(items) {
  await writeJson(businessFile, items);
}

export async function findLocalBusinessByUserId(userId) {
  const businesses = await getLocalBusinesses();
  return businesses.find((item) => item.user === userId) || null;
}

export async function upsertLocalBusiness(item) {
  const businesses = await getLocalBusinesses();
  const index = businesses.findIndex((existing) => existing.user === item.user);

  if (index >= 0) {
    businesses[index] = { ...businesses[index], ...item };
  } else {
    businesses.push(item);
  }

  await saveLocalBusinesses(businesses);
  return item;
}