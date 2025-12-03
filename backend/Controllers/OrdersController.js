import { Order, Digital, Offset } from "../Models/Orders.js";
import { Sequelize, Op } from "sequelize";


// ✅ Get ALL orders within a specific date range (no pagination)
export const getOrdersByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date range condition only if provided
    const dateCondition =
      startDate && endDate
        ? {
            createdAt: {
              [Op.between]: [
                new Date(`${startDate}T00:00:00`),
                new Date(`${endDate}T23:59:59`),
              ],
            },
          }
        : {};

    // Fetch ALL filtered orders (latest first)
    const orders = await Order.findAll({
      where: dateCondition,
      include: [
        { model: Digital, as: "digital" },
        { model: Offset, as: "offset" },
      ],
      order: [["id", "DESC"]],
    });

    // Return all results
    res.json({
      totalOrders: orders.length,
      dateRange: { startDate, endDate },
      orders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching orders by date", error });
  }
};

export const searchOrders = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({ message: "عبارت جستجو الزامی است" });
    }

    const cleaned = q.trim();

    // Treat as ID only if numeric AND short length (e.g. <= 6)
    const isId = !isNaN(cleaned) && cleaned.length <= 6;

    // Build WHERE clause
    let whereClause = {};

    if (isId) {
      whereClause = { id: Number(cleaned) };
    } else {
      whereClause = {
        [Op.or]: [
          Sequelize.where(Sequelize.json("customer.name"), {
            [Op.like]: `%${cleaned}%`,
          }),

          Sequelize.where(Sequelize.json("customer.phone_number"), {
            [Op.like]: `%${cleaned}%`,
          }),
        ],
      };
    }

    const orders = await Order.findAll({
      where: whereClause,
      include: [
        { model: Digital, as: "digital" },
        { model: Offset, as: "offset" },
        // { model: Customer, as: "customer" },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (!orders.length) {
      return res.status(404).json({ message: "هیچ نتیجه‌ای یافت نشد" });
    }

    res.json(orders);
  } catch (error) {
    console.error("❌ Search error:", error);
    res.status(500).json({ message: "خطا در جستجو", error: error.message });
  }
};


// Create a new order
export const createOrder = async (req, res) => {
  try {
    const {
      customer,
      digital,
      offset,
      recip,
      remained,
      total,
      digitalId, // <-- take from request body
      total_money_digital,
      total_money_offset,
    } = req.body;

    // Create order with customer JSON and digitalId
    const order = await Order.create({
      customer,
      recip,
      remained,
      total,
      digitalId, // <-- added here
      total_money_digital,
      total_money_Offset: total_money_offset,
      isDelivered: false,
    });

    // Create digital items
    if (digital && digital.length) {
      const digitalItems = digital.map((item) => ({
        ...item,
        orderId: order.id,
      }));
      await Digital.bulkCreate(digitalItems);
    }

    // Create offset items
    if (offset && offset.length) {
      const offsetItems = offset.map((item) => ({
        ...item,
        orderId: order.id,
      }));
      await Offset.bulkCreate(offsetItems);
    }

    // Return the new order with items
    const newOrder = await Order.findByPk(order.id, {
      include: [
        { model: Digital, as: "digital" },
        { model: Offset, as: "offset" },
      ],
    });

    res.status(201).json(newOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating order", error });
  }
};


// Get all orders
export const getOrders = async (req, res) => {
  try {
    // Get page and limit from query parameters, with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Fetch paginated orders in reverse (latest first)
    const { count, rows: orders } = await Order.findAndCountAll({
      include: [
        { model: Digital, as: "digital" },
        { model: Offset, as: "offset" },
      ],
      distinct: true, // Ensures correct count when including relations
      limit,
      offset,
      order: [["id", "DESC"]], // ✅ Sort by id descending (latest first)
    });

    // Return paginated response
    res.json({
      totalOrders: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      perPage: limit,
      orders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching orders", error });
  }
};


// Get single order by ID
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id, {
      include: [
        { model: Digital, as: "digital" },
        { model: Offset, as: "offset" },
      ],
    });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching order", error });
  }
};

// Update an order
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customer,
      recip,
      remained,
      total,
      digitalId,
      total_money_digital,
      total_money_offset,
      digital,
      offset,
    } = req.body;

    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Update main order
    await order.update({
      customer: customer ?? order.customer,
      recip: recip ?? order.recip,
      remained: remained ?? order.remained,
      total: total ?? order.total,
      digitalId: digitalId ?? order.digitalId,
      total_money_digital: total_money_digital ?? order.total_money_digital,
      total_money_Offset: total_money_offset ?? order.total_money_Offset,
    });

    // Update digital items (delete old, insert new)
    if (digital) {
      await Digital.destroy({ where: { orderId: id } });
      if (digital.length > 0) {
        const digitalItems = digital.map((item) => ({ ...item, orderId: id }));
        await Digital.bulkCreate(digitalItems);
      }
    }

    // Update offset items (delete old, insert new)
    if (offset) {
      await Offset.destroy({ where: { orderId: id } });
      if (offset.length > 0) {
        const offsetItems = offset.map((item) => ({ ...item, orderId: id }));
        await Offset.bulkCreate(offsetItems);
      }
    }

    // Return updated order with items
    const updatedOrder = await Order.findByPk(id, {
      include: [
        { model: Digital, as: "digital" },
        { model: Offset, as: "offset" },
      ],
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating order", error });
  }
};

// ✅ Partial update controller
export const updateOrderProperties = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body; // Only fields sent in body will be updated

    // Find the order
    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Update only the fields provided
    await order.update(updateData);

    // Return updated order
    const updatedOrder = await Order.findByPk(id);
    res.json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating order", error });
  }
};

// Delete an order
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Delete associated digital and offset items
    await Digital.destroy({ where: { orderId: id } });
    await Offset.destroy({ where: { orderId: id } });

    // Delete the order
    await order.destroy();
    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting order", error });
  }
};
