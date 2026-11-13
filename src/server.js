import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import redisClient, { connectRedis } from "./config/redis.js";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin))
        return callback(null, true);
      return callback(new Error("Origin not allowed by CORS"));
    },
  }),
);

app.use(express.json({ limit: "1mb" }));
app.get("/", (_req, res) =>
  res
    .status(200)
    .json({ success: true, message: "Coffee Shop API is running" }),
);

// API routes
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/auth", authRoutes);
// Health check
app.get("/api/health", (req, res) => {
  res.status(redisClient.isReady ? 200 : 503).json({
    success: redisClient.isReady,
    message: "Coffee Shop API",
    server: "running",
    database: redisClient.isReady ? "connected" : "disconnected",
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "API endpoint not found" });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status =
    error.status || (error.type === "entity.parse.failed" ? 400 : 500);
  res.status(status).json({
    success: false,
    message:
      status === 400
        ? "Invalid request body"
        : status === 500
          ? "Internal server error"
          : error.message,
  });
});

// Start server
async function startServer() {
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
      throw new Error(
        "JWT_SECRET must be configured with at least 32 characters",
      );
    await connectRedis();

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
