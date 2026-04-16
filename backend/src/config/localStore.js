import { mkdir, readFile, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = process.env.VERCEL
  ? path.join(os.tmpdir(), "autoclient-ai", "data")
  : path.resolve(__dirname, "../data");
const usersFile = path.join(dataDir, "users.json");

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

export async function getLocalUsers() {
  return readJson(usersFile, []);
}

export async function countLocalUsers() {
  const users = await getLocalUsers();
  return users.length;
}

export async function saveLocalUsers(users) {
  await writeJson(usersFile, users);
}

export async function findLocalUserByEmail(email) {
  const users = await getLocalUsers();
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function findLocalUserById(id) {
  const users = await getLocalUsers();
  return users.find((user) => user._id === id) || null;
}

export async function upsertLocalUser(user) {
  const users = await getLocalUsers();
  const index = users.findIndex((existing) => existing._id === user._id);

  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }

  await saveLocalUsers(users);
  return user;
}
