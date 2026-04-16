import mongoose from "mongoose";
import Business from "../models/Business.js";
import { isDBConnected } from "../config/db.js";
import {
  findLocalBusinessByUserId,
  upsertLocalBusiness,
} from "../config/localBusinessStore.js";
import { encrypt, tryDecryptOrNull } from "../utils/encryption.js";

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function decryptOrPlain(value) {
  if (typeof value !== "string") {
    return "";
  }

  const decrypted = tryDecryptOrNull(value);
  return decrypted ?? value;
}

function decodeListField(value) {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return [];
    }

    if (value.length === 1) {
      const item = String(value[0] ?? "");
      const maybeDecrypted = decryptOrPlain(item);

      try {
        const parsed = JSON.parse(maybeDecrypted);
        if (Array.isArray(parsed)) {
          return normalizeList(parsed);
        }
      } catch {
        // Fallback to plain text handling.
      }

      return normalizeList(maybeDecrypted);
    }

    return normalizeList(value);
  }

  if (typeof value === "string") {
    const maybeDecrypted = decryptOrPlain(value);

    try {
      const parsed = JSON.parse(maybeDecrypted);
      if (Array.isArray(parsed)) {
        return normalizeList(parsed);
      }
    } catch {
      // Fallback to plain text handling.
    }

    return normalizeList(maybeDecrypted);
  }

  return [];
}

function normalizeBusinessInput(payload) {
  const name = String(payload?.name || payload?.businessName || "").trim();
  const services = normalizeList(payload?.services);
  const pricing = String(payload?.pricing || "").trim();
  const faqs = normalizeList(payload?.faqs);

  return { name, services, pricing, faqs };
}

function validateBusinessInput(payload) {
  const normalized = normalizeBusinessInput(payload);

  if (!normalized.name || !normalized.services.length || !normalized.pricing || !normalized.faqs.length) {
    return {
      ok: false,
      msg: "Business name, services, pricing, and FAQs are required.",
      normalized,
    };
  }

  return {
    ok: true,
    normalized,
  };
}

function encodeBusinessPayload(userId, normalized) {
  return {
    user: userId,
    name: encrypt(normalized.name),
    services: [encrypt(JSON.stringify(normalized.services))],
    pricing: encrypt(normalized.pricing),
    faqs: [encrypt(JSON.stringify(normalized.faqs))],
  };
}

function decodeBusinessRecord(record) {
  if (!record) {
    return null;
  }

  const name = decryptOrPlain(record.name);
  const services = decodeListField(record.services);
  const pricing = decryptOrPlain(record.pricing);
  const faqs = decodeListField(record.faqs);

  return {
    user: String(record.user || ""),
    name,
    businessName: name,
    services,
    pricing,
    faqs,
  };
}

function isMongoUserId(userId) {
  return mongoose.Types.ObjectId.isValid(String(userId));
}

async function getMongoBusiness(userId) {
  return Business.findOne({ user: userId }).lean();
}

async function upsertMongoBusiness(userId, encodedPayload, requireExisting) {
  if (requireExisting) {
    const existing = await Business.findOne({ user: userId }).lean();

    if (!existing) {
      return null;
    }
  }

  return Business.findOneAndUpdate(
    { user: userId },
    encodedPayload,
    {
      new: true,
      upsert: !requireExisting,
      setDefaultsOnInsert: true,
      runValidators: true,
    }
  ).lean();
}

export async function getBusinessProfileForUser(userId) {
  const normalizedUserId = String(userId);

  if (isDBConnected() && isMongoUserId(normalizedUserId)) {
    const mongoRecord = await getMongoBusiness(normalizedUserId);
    return decodeBusinessRecord(mongoRecord);
  }

  const localRecord = await findLocalBusinessByUserId(normalizedUserId);
  return decodeBusinessRecord(localRecord);
}

export async function saveBusinessProfileForUser(userId, payload, options = {}) {
  const { requireExisting = false } = options;
  const normalizedUserId = String(userId);
  const validation = validateBusinessInput(payload);

  if (!validation.ok) {
    return {
      ok: false,
      status: 400,
      msg: validation.msg,
      business: null,
    };
  }

  const encoded = encodeBusinessPayload(normalizedUserId, validation.normalized);

  if (isDBConnected() && isMongoUserId(normalizedUserId)) {
    const mongoRecord = await upsertMongoBusiness(normalizedUserId, {
      ...encoded,
      user: normalizedUserId,
    }, requireExisting);

    if (!mongoRecord) {
      return {
        ok: false,
        status: 404,
        msg: "Business profile not found. Please save first.",
        business: null,
      };
    }

    return {
      ok: true,
      status: 200,
      business: decodeBusinessRecord(mongoRecord),
    };
  }

  if (requireExisting) {
    const existingLocal = await findLocalBusinessByUserId(normalizedUserId);

    if (!existingLocal) {
      return {
        ok: false,
        status: 404,
        msg: "Business profile not found. Please save first.",
        business: null,
      };
    }
  }

  const localRecord = await upsertLocalBusiness({
    ...encoded,
    user: normalizedUserId,
  });

  return {
    ok: true,
    status: 200,
    business: decodeBusinessRecord(localRecord),
  };
}

export function isBusinessProfileComplete(business) {
  return Boolean(
    business?.name?.trim() &&
      Array.isArray(business.services) &&
      business.services.length > 0 &&
      business?.pricing?.trim() &&
      Array.isArray(business.faqs) &&
      business.faqs.length > 0
  );
}
