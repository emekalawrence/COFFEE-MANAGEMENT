import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import dotenv from "dotenv";
import redisClient, { connectRedis } from "../config/redis.js";

dotenv.config();

async function createAdmin() {
  try {
    const name = process.env.ADMIN_NAME;
    const email = process.env.ADMIN_EMAIL?.toLowerCase();

    if (!name || !email || !process.env.JWT_SECRET) {
      throw new Error("Admin details or JWT_SECRET are missing");
    }

    await connectRedis();

    const existingAdmin = await redisClient.get(`staff:${email}`);

    if (existingAdmin) {
      console.log("An account with this email already exists.");
      return;
    }

    // Ask for the password without displaying it
    const password = process.env.ADMIN_PASSWORD;

    if (!password || password.length < 12) {
      throw new Error(
        "Set a strong ADMIN_PASSWORD of at least 12 characters in .env",
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = {
      id: crypto.randomUUID(),
      name,
      email,
      passwordHash,
      role: "admin",
      createdAt: new Date().toISOString(),
    };

    await redisClient.set(`staff:${email}`, JSON.stringify(admin));

    console.log("Admin account created successfully.");
  } catch (error) {
    console.error("Admin setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
  }
}

createAdmin();
