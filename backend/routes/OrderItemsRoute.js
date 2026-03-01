import express from "express";
import {
  createOrderItem,
  getOrderItems,
  getOrderItemById,
  updateOrderItem,
  updateOrderItemProperties,
  deleteOrderItem,
  getCustomerOrdersByType,
  simpleSearchOrderItems,
  getOrderItemsByDateRange,
  getOrderItemsByCustomerAndDateRange, // 👈 ADD THIS IMPORT
} from "../Controllers/OrderItemsController.js";

const OrderItemRoute = express.Router();

// ✅ Put specific routes FIRST
OrderItemRoute.get("/search", simpleSearchOrderItems);
OrderItemRoute.get("/date_range", getOrderItemsByDateRange);
OrderItemRoute.get("/customer/:customerId/date_range", getOrderItemsByCustomerAndDateRange); // 👈 ADD THIS ROUTE

// Then generic routes
OrderItemRoute.get("/:customerId/:type", getCustomerOrdersByType);
OrderItemRoute.get("/:id", getOrderItemById);

OrderItemRoute.patch("/:id", updateOrderItemProperties);
OrderItemRoute.post("/", createOrderItem);
OrderItemRoute.get("/", getOrderItems);
OrderItemRoute.put("/:id", updateOrderItem);
OrderItemRoute.delete("/:id", deleteOrderItem);

export default OrderItemRoute;