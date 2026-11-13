import express from "express";
import crypto from "node:crypto";
import redisClient from "../config/redis.js";
import { verifyStaff } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET all menu items
router.get("/", async (req, res) => {
  try {
    const menuIds = await redisClient.sMembers("menu:ids");

    const menuItems = await Promise.all(
      menuIds.map(async (id) => {
        const item = await redisClient.get(`menu:${id}`);
        return item ? JSON.parse(item) : null;
      }),
    );

    const validItems = menuItems.filter((item) => item !== null);

    res.status(200).json({
      success: true,
      count: validItems.length,
      data: validItems,
    });
  } catch (error) {
    console.error("Error fetching menu:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve menu items",
    });
  }
});

// GET one menu item by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const item = await redisClient.get(`menu:${id}`);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    res.status(200).json({
      success: true,
      data: JSON.parse(item),
    });
  } catch (error) {
    console.error("Error fetching menu item:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve menu item",
    });
  }
});

// POST a new menu item
router.post("/", verifyStaff, async (req, res) => {
  try {
    const { name, description, price, category, available, image } = req.body;

    // Validate required fields
    if (!name || !description || !category || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, description, price and category are required",
      });
    }

    if (
      typeof name !== "string" ||
      typeof description !== "string" ||
      typeof category !== "string" ||
      name.trim() === "" ||
      description.trim() === "" ||
      category.trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, description and category must be valid text",
      });
    }

    if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a positive number",
      });
    }

    if (available !== undefined && typeof available !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Availability must be true or false",
      });
    }

    if (image !== undefined && (typeof image !== "string" || !/^\/image\/[^/]+$/.test(image))) {
      return res.status(400).json({
        success: false,
        message: "Image must be a valid path from the menu image folder",
      });
    }

    // Generate a unique ID
    const id = crypto.randomUUID();

    // Create the menu item
    const newItem = {
      id,
      name: name.trim(),
      description: description.trim(),
      price,
      category: category.trim(),
      available: available ?? true,
      ...(image ? { image } : {}),
    };

    // Save item in Redis
    await redisClient.set(`menu:${id}`, JSON.stringify(newItem));

    // Add ID to the menu index
    await redisClient.sAdd("menu:ids", id);

    res.status(201).json({
      success: true,
      message: "Menu item created successfully",
      data: newItem,
    });
  } catch (error) {
    console.error("Error creating menu item:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to create menu item",
    });
  }
});

// PUT - Update an existing menu item
router.put("/:id", verifyStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, available, image } = req.body;

    // Check whether the item exists
    const existingItem = await redisClient.get(`menu:${id}`);

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }
    const existingMenuItem = JSON.parse(existingItem);

    // Validate required fields
    if (
      !name ||
      !description ||
      !category ||
      price === undefined ||
      typeof available !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "All menu item fields are required",
      });
    }

    if (
      typeof name !== "string" ||
      typeof description !== "string" ||
      typeof category !== "string" ||
      !name.trim() ||
      !description.trim() ||
      !category.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Text fields must contain valid text",
      });
    }

    if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a positive number",
      });
    }

    if (image !== undefined && (typeof image !== "string" || !/^\/image\/[^/]+$/.test(image))) {
      return res.status(400).json({
        success: false,
        message: "Image must be a valid path from the menu image folder",
      });
    }

    // Create updated item
    const updatedItem = {
      id,
      name: name.trim(),
      description: description.trim(),
      price,
      category: category.trim(),
      available,
      ...((image || existingMenuItem.image)
        ? { image: image || existingMenuItem.image }
        : {}),
    };

    // Save updated item in Redis
    await redisClient.set(`menu:${id}`, JSON.stringify(updatedItem));

    res.status(200).json({
      success: true,
      message: "Menu item updated successfully",
      data: updatedItem,
    });
  } catch (error) {
    console.error("Error updating menu item:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update menu item",
    });
  }
});

// DELETE - Remove a menu item
router.delete("/:id", verifyStaff, async (req, res) => {
  try {
    const { id } = req.params;

    // Check whether the item exists
    const existingItem = await redisClient.get(`menu:${id}`);

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    // Remove item from Redis
    await redisClient.del(`menu:${id}`);
    await redisClient.sRem("menu:ids", id);

    res.status(200).json({
      success: true,
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting menu item:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to delete menu item",
    });
  }
});

export default router;
