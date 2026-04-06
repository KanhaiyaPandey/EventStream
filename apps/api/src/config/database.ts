import mongoose from "mongoose";
import { env } from "./env";

function redactMongoUri(uri: string): string {
  try {
    const url = new URL(uri);
    if (url.username) url.username = "***";
    if (url.password) url.password = "***";
    return url.toString();
  } catch {
    // Fallback for non-standard/invalid URIs: redact credentials segment if present.
    return uri.replace(/\/\/([^@/]+)@/g, "//***:***@");
  }
}

function validateMongoUri(uri: string): void {
  // Common mistake: putting the database name as a query param.
  // The MongoDB Node driver rejects unknown options like `eventstream`.
  if (/[?&]eventstream=/.test(uri)) {
    throw new Error(
      [
        `Invalid MONGODB_URI: query option "eventstream" is not supported.`,
        `Put the database name in the path instead of the query string.`,
        `Example (Atlas): mongodb+srv://USER:PASS@HOST/eventstream?retryWrites=true&w=majority`,
        `Example (local): mongodb://localhost:27017/eventstream`,
      ].join(" "),
    );
  }
}

export async function connectDatabase(): Promise<void> {
  try {
    validateMongoUri(env.MONGODB_URI);
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.info(`[DB] Connected to MongoDB: ${redactMongoUri(env.MONGODB_URI)}`);
  } catch (err) {
    console.error("[DB] Connection failed:", err);
    process.exit(1);
  }
}

mongoose.connection.on("disconnected", () => {
  console.warn("[DB] Disconnected from MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("[DB] Error:", err);
});
