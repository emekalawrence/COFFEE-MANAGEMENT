import express from "express";
import crypto from "node:crypto";
import redisClient from "../config/redis.js";
import { verifyStaff } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET all orders
router.get("/", verifyStaff, async (req, res) => {
  try {
    // Get all order IDs from Redis
    const orderIds = await redisClient.sMembers("orders:ids");

    // Retrieve each order
    const orders = await Promise.all(
      orderIds.map(async (id) => {
        const order = await redisClient.get(`order:${id}`);
        return order ? JSON.parse(order) : null;
      }),
    );

    const validOrders = orders.filter((order) => order !== null);

    res.status(200).json({
      success: true,
      count: validOrders.length,
      data: validOrders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve orders",
    });
  }
});

// GET customer-safe order status using the private tracking token returned at checkout
router.get("/:id/track", async (req, res) => {
  try {
    const token = req.get("authorization")?.match(/^Bearer ([a-f\d]{64})$/i)?.[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "A valid tracking token is required",
      });
    }

    const storedHash = await redisClient.get(`order-track:${req.params.id}`);

    if (!storedHash) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const providedHash = crypto.createHash("sha256").update(token).digest();
    const expectedHash = Buffer.from(storedHash, "hex");

    if (
      expectedHash.length !== providedHash.length ||
      !crypto.timingSafeEqual(providedHash, expectedHash)
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid tracking token",
      });
    }

    const orderData = await redisClient.get(`order:${req.params.id}`);

    if (!orderData) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const order = JSON.parse(orderData);

    res.status(200).json({
      success: true,
      data: {
        id: order.id,
        orderNumber: order.orderNumber || order.id,
        status: order.status,
        fulfilmentType: order.fulfilmentType,
        pickupDate: order.pickupDate,
        pickupTime: order.pickupTime,
        readyAt:
          order.readyAt ||
          (["Ready", "Collected"].includes(order.status)
            ? order.updatedAt || order.createdAt
            : undefined),
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching tracked order status:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve order status",
    });
  }
});

// GET one order by ID
router.get("/:id", verifyStaff, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await redisClient.get(`order:${id}`);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      data: JSON.parse(order),
    });
  } catch (error) {
    console.error("Error fetching order:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve order",
    });
  }
});

// POST a new order
router.post("/", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      email,
      pickupTime,
      pickupDate,
      notes,
      fulfilmentType,
      paymentMethod,
      deliveryLocation,
      items,
    } = req.body;

    // Validate personal information
    if (
      typeof firstName !== "string" ||
      !firstName.trim() ||
      typeof lastName !== "string" ||
      !lastName.trim() ||
      typeof phone !== "string" ||
      !phone.trim() ||
      typeof email !== "string" ||
      !email.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid personal information is required",
      });
    }

    // Validate pickup time
    if (
      typeof pickupTime !== "string" ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(pickupTime)
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid pickup time is required",
      });
    }

    if (pickupDate !== undefined && (typeof pickupDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(pickupDate))) {
      return res.status(400).json({ success: false, message: "A valid pickup date is required" });
    }

    // Validate fulfilment choice
    if (!["pickup", "local_delivery"].includes(fulfilmentType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid fulfilment type",
      });
    }

    // Validate payment choice
    const expectedPayment =
      fulfilmentType === "pickup" ? "pay_at_pickup" : "pay_on_delivery";

    if (paymentMethod !== expectedPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment method does not match fulfilment type",
      });
    }

    // Validate delivery location
    if (fulfilmentType === "local_delivery") {
      const { address, coordinates } = deliveryLocation || {};

      if (
        typeof address !== "string" ||
        !address.trim() ||
        !coordinates ||
        typeof coordinates.lat !== "number" ||
        typeof coordinates.lng !== "number" ||
        !Number.isFinite(coordinates.lat) ||
        !Number.isFinite(coordinates.lng) ||
        coordinates.lat < -90 ||
        coordinates.lat > 90 ||
        coordinates.lng < -180 ||
        coordinates.lng > 180
      ) {
        return res.status(400).json({
          success: false,
          message: "A valid delivery address and location are required",
        });
      }
    }

    // Validate ordered items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one menu item is required",
      });
    }

    for (const item of items) {
      if (
        typeof item.menuItemId !== "string" ||
        !item.menuItemId.trim() ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Each item needs a valid ID and quantity",
        });
      }
    }

    // Retrieve menu items and calculate total
    const orderItems = [];

    for (const item of items) {
      const menuData = await redisClient.get(`menu:${item.menuItemId}`);

      if (!menuData) {
        return res.status(404).json({
          success: false,
          message: "A selected menu item was not found",
        });
      }

      const menuItem = JSON.parse(menuData);

      if (!menuItem.available) {
        return res.status(400).json({
          success: false,
          message: `${menuItem.name} is unavailable`,
        });
      }

      orderItems.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        subtotal: menuItem.price * item.quantity,
      });
    }

    const total = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

    // Create order
    const id = crypto.randomUUID();
    const trackingToken = crypto.randomBytes(32).toString("hex");
    const trackingTokenHash = crypto
      .createHash("sha256")
      .update(trackingToken)
      .digest("hex");

    const newOrder = {
      id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      pickupTime,
      ...(pickupDate ? { pickupDate } : {}),
      notes: typeof notes === "string" ? notes.trim() : "",
      fulfilmentType,
      paymentMethod,
      ...(fulfilmentType === "local_delivery" ? { deliveryLocation } : {}),
      items: orderItems,
      total,
      status: "Pending",
      createdAt: new Date().toISOString(),
    };

    // Save order in Redis
    await redisClient.set(`order:${id}`, JSON.stringify(newOrder));
    await redisClient.set(`order-track:${id}`, trackingTokenHash);

    await redisClient.sAdd("orders:ids", id);

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: newOrder,
      trackingToken,
    });
  } catch (error) {
    console.error("Error creating order:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to create order",
    });
  }
});

// PATCH - Update order status
router.patch("/:id/status", verifyStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Allowed order statuses
    const allowedStatuses = ["Pending", "Preparing", "Ready", "Collected"];

    // Validate status
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    // Find existing order
    const orderData = await redisClient.get(`order:${id}`);

    if (!orderData) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Update order
    const order = JSON.parse(orderData);
    if (status === "Ready" && order.status !== "Ready") {
      order.readyAt = new Date().toISOString();
    }
    order.status = status;
    order.updatedAt = new Date().toISOString();

    // Save updated order in Redis
    await redisClient.set(`order:${id}`, JSON.stringify(order));

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  } catch (error) {
    console.error("Error updating order status:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update order status",
    });
  }
});

export default router;
