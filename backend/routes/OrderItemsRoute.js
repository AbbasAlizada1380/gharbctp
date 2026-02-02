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
} from "../Controllers/OrderItemsController.js";

const OrderItemRoute = express.Router();

// ✅ Put specific routes FIRST
OrderItemRoute.get("/search", simpleSearchOrderItems);
OrderItemRoute.get("/date_range", getOrderItemsByDateRange); // 👈 ADD HERE

// Then generic routes
OrderItemRoute.get("/:customerId/:type", getCustomerOrdersByType);
OrderItemRoute.get("/:id", getOrderItemById);

OrderItemRoute.patch("/:id", updateOrderItemProperties);
OrderItemRoute.post("/", createOrderItem);
OrderItemRoute.get("/", getOrderItems);
OrderItemRoute.put("/:id", updateOrderItem);
OrderItemRoute.delete("/:id", deleteOrderItem);

export default OrderItemRoute;
