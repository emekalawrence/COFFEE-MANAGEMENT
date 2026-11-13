import express from "express";
import redisClient from "../config/redis.js";
import { verifyStaff } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET dashboard statistics
router.get("/stats", verifyStaff, async (req, res) => {
  try {
    // Retrieve all order IDs
    const orderIds = await redisClient.sMembers("orders:ids");

    // Retrieve all orders from Redis
    const orders = await Promise.all(
      orderIds.map(async (id) => {
        const data = await redisClient.get(`order:${id}`);
        return data ? JSON.parse(data) : null;
      }),
    );

    const validOrders = orders.filter((order) => order !== null);

    // Calculate order counts
    const totalOrders = validOrders.length;

    const pendingOrders = validOrders.filter(
      (order) => order.status === "Pending",
    ).length;

    const preparingOrders = validOrders.filter(
      (order) => order.status === "Preparing",
    ).length;

    const readyOrders = validOrders.filter(
      (order) => order.status === "Ready",
    ).length;

    const collectedOrders = validOrders.filter(
      (order) => order.status === "Collected",
    ).length;

    // Calculate today's sales using collected orders
    const today = new Date().toISOString().slice(0, 10);

    const todaySales = validOrders
      .filter(
        (order) =>
          order.status === "Collected" && order.createdAt?.startsWith(today),
      )
      .reduce((sum, order) => sum + order.total, 0);

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        preparingOrders,
        readyOrders,
        collectedOrders,
        todaySales,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard statistics:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve dashboard statistics",
    });
  }
});

export default router;
