import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

// Serverless-friendly connection cache (prevents creating many connections)
let cached = global._resolvexMongoose;
if (!cached) {
  cached = global._resolvexMongoose = { conn: null, promise: null };
}

export default async function connectDB() {
  if (!MONGO_URI) {
    throw new Error("MONGO_URI is missing");
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGO_URI, {
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
      })
      .then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

