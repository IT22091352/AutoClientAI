import mongoose from "mongoose";

mongoose.set("bufferCommands", false);

const RECONNECT_INTERVAL_MS = Number(process.env.MONGO_RECONNECT_INTERVAL_MS || 30000);
let reconnectTimer = null;
let retryAttempt = 0;

const scheduleReconnect = () => {
  if (reconnectTimer || mongoose.connection.readyState === 1) {
    return;
  }

  retryAttempt += 1;
  console.warn(`Retrying in 30 seconds (attempt ${retryAttempt})`);

  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;

    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
  }, RECONNECT_INTERVAL_MS);
};

const connectWithUri = async (uri, label) => {
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });

    retryAttempt = 0;
    console.log(`Connected successfully (${label})`);
    return true;
  } catch (error) {
    if (label === "primary") {
      console.warn("Primary MongoDB failed");
    } else {
      console.warn("Fallback MongoDB failed");
    }

    console.warn(error.message);
    return false;
  }
};

export const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI;
  const fallbackUri = process.env.MONGO_URI_FALLBACK;
  if (!primaryUri && !fallbackUri) {
    console.warn("MONGO_URI and MONGO_URI_FALLBACK are missing. Continuing without MongoDB.");
    scheduleReconnect();
    return false;
  }

  if (primaryUri) {
    const primaryConnected = await connectWithUri(primaryUri, "primary");
    if (primaryConnected) {
      return true;
    }
  }

  if (fallbackUri) {
    console.warn("Using fallback connection");
    const fallbackConnected = await connectWithUri(fallbackUri, "fallback");
    if (fallbackConnected) {
      return true;
    }
  }

  console.warn("MongoDB unavailable. Continuing without persistence.");
  scheduleReconnect();
  return false;
};

export const isDBConnected = () => mongoose.connection.readyState === 1;