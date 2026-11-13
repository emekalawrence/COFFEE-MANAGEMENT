import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import redisClient from "../config/redis.js";
import crypto from "node:crypto";
import { verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// POST - Staff login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find staff account in Redis
    const staffData = await redisClient.get(
      `staff:${email.trim().toLowerCase()}`,
    );

    if (!staffData) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const staff = JSON.parse(staffData);

    // Compare submitted password with stored password hash
    const passwordMatches = await bcrypt.compare(password, staff.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Create authentication token
    const token = jwt.sign(
      {
        id: staff.id,
        email: staff.email,
        role: staff.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
      },
    });
  } catch (error) {
    console.error("Staff login error:", error.message);

    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});

// POST - Admin creates a staff account
router.post("/register", verifyAdmin, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      password.length < 12
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, valid email and password of at least 12 characters are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check whether the email is already registered
    const existingStaff = await redisClient.get(`staff:${normalizedEmail}`);

    if (existingStaff) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create staff account
    const newStaff = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "staff",
      createdAt: new Date().toISOString(),
    };

    await redisClient.set(`staff:${normalizedEmail}`, JSON.stringify(newStaff));

    return res.status(201).json({
      success: true,
      message: "Staff account created successfully",
      staff: {
        id: newStaff.id,
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role,
      },
    });
  } catch (error) {
    console.error("Staff registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create staff account",
    });
  }
});

export default router;
