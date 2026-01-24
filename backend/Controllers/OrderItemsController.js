import OrderItem from "../Models/OrderItems.js";
import Customer from "../Models/Customers.js";
import Remain from "../Models/Remain.js";
import sequelize from "../dbconnection.js";

export const createOrderItem = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    let { customer, newCustomerName, orderItems } = req.body;

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({
        message: "orderItems are required",
      });
    }

    let customerRecord = null;

    // 🔹 1. Find or create customer
    if (customer) {
      customerRecord = await Customer.findByPk(customer, { transaction });

      if (!customerRecord) {
        return res.status(404).json({ message: "Customer not found" });
      }
    } else if (newCustomerName) {
      customerRecord = await Customer.create(
        {
          fullname: newCustomerName,
          isActive: false,
        },
        { transaction }
      );
    } else {
      return res.status(400).json({
        message: "Either customer or newCustomerName is required",
      });
    }

    const customerId = customerRecord.id;

    // 🔹 2. Create order items
    const createdOrderItems = [];

    for (const item of orderItems) {
      const { size, qnty, price, money, fileName } = item;

      if (!size || !qnty || !price) {
        throw new Error("Each order item must have size, qnty and price");
      }

      const orderItem = await OrderItem.create(
        {
          size,
          qnty: Number(qnty),
          price: Number(price),
          money: money ? Number(money) : Number(qnty) * Number(price),
          fileName,
          customerId,
        },
        { transaction }
      );

      createdOrderItems.push(orderItem);
    }

    // 🔹 3. Collect OrderItem IDs
    const orderItemIds = createdOrderItems.map((item) => item.id);

    // 🔹 4. Find or create Remain
    let remain = await Remain.findOne({
      where: { customerId },
      transaction,
    });

    const mergeUnique = (a = [], b = []) => [...new Set([...a, ...b])];

    if (!remain) {
      remain = await Remain.create(
        {
          customerId,
          orderId: orderItemIds,
          remainOrders: orderItemIds, // ✅ ADD HERE
        },
        { transaction }
      );
    } else {
      await remain.update(
        {
          orderId: mergeUnique(remain.orderId, orderItemIds),
          remainOrders: mergeUnique(remain.remainOrders, orderItemIds), // ✅ ADD HERE
        },
        { transaction }
      );
    }



    await transaction.commit();

    res.status(201).json({
      message: "Order created successfully",
      customer: customerRecord,
      orderItems: createdOrderItems,
      remain,
    });
  } catch (error) {
    await transaction.rollback();
    console.error(error);

    res.status(500).json({
      message: "Error creating order",
      error: error.message,
    });
  }
};



/* ===========================
   Get Order Items (Paginated)
=========================== */
export const getOrderItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await OrderItem.findAndCountAll({
      order: [["id", "DESC"]],
      limit,
      offset,
    });

    res.json({
      orderItems: rows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        perPage: limit,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching order items",
      error: error.message,
    });
  }
};

/* ===========================
   Get Order Item by ID
=========================== */
export const getOrderItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await OrderItem.findByPk(id, {
      include: [{ model: Customer, as: "customer" }],
    });

    if (!item) {
      return res.status(404).json({ message: "Order item not found" });
    }

    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching order item",
      error: error.message,
    });
  }
};

/* ===========================
   Update Order Item (PUT)
=========================== */
export const updateOrderItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { size, qnty, price, money, fileName } = req.body;

    // Find the order item
    const item = await OrderItem.findByPk(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Order item not found"
      });
    }

    // Calculate money if not provided
    const calculatedMoney = money || (Number(qnty || item.qnty) * Number(price || item.price));

    // Update the item
    await item.update({
      size: size ?? item.size,
      qnty: qnty ?? item.qnty,
      price: price ?? item.price,
      money: calculatedMoney,
      fileName: fileName ?? item.fileName,
    });

    // Return updated item (no include needed unless you want customer data)
    const updatedItem = await OrderItem.findByPk(id);

    res.json({
      success: true,
      message: "Order item updated successfully",
      data: updatedItem
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error updating order item",
      error: error.message,
    });
  }
};

/* ===========================
   Partial Update (PATCH)
=========================== */
export const updateOrderItemProperties = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const item = await OrderItem.findByPk(id);
    if (!item) {
      return res.status(404).json({ message: "Order item not found" });
    }

    // Auto-recalculate money if qnty or price is updated
    if (updateData.qnty || updateData.price) {
      const qnty = updateData.qnty ?? item.qnty;
      const price = updateData.price ?? item.price;
      updateData.money = qnty * price;
    }

    await item.update(updateData);

    const updatedItem = await OrderItem.findByPk(id, {
      include: [{ model: Customer, as: "customer" }],
    });

    res.json(updatedItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error updating order item",
      error: error.message,
    });
  }
};

/* ===========================
   Delete Order Item
=========================== */
export const deleteOrderItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await OrderItem.findByPk(id);
    if (!item) {
      return res.status(404).json({ message: "Order item not found" });
    }

    await item.destroy();
    res.json({ message: "Order item deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error deleting order item",
      error: error.message,
    });
  }
};
