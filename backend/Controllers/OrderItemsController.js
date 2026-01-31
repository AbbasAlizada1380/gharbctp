import OrderItem from "../Models/OrderItems.js";
import Customer from "../Models/Customers.js";
import Remain from "../Models/Remain.js";
import sequelize from "../dbconnection.js";
import CompanyStock from "../Models/CompanyStock.js";
import { Op } from "sequelize";

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

    // 🔹 2. Validate stock availability before processing
    const stockUpdates = [];
    const createdOrderItems = [];

    for (const item of orderItems) {
      const { size, qnty, price, money, fileName } = item;

      if (!size || !qnty || !price) {
        throw new Error("Each order item must have size, qnty and price");
      }

      const quantity = Number(qnty);
      
      // Check stock availability
      const companyStock = await CompanyStock.findOne({
        where: { size },
        transaction,
        lock: transaction.LOCK.UPDATE // Lock the row for update
      });

      if (!companyStock) {
        throw new Error(`Size ${size} not found in company stock`);
      }

      const currentStock = parseInt(companyStock.quantity);
      if (currentStock < quantity) {
        throw new Error(`Insufficient stock for size ${size}. Available: ${currentStock}, Requested: ${quantity}`);
      }

      stockUpdates.push({
        companyStock,
        quantity,
        size
      });
    }

    // 🔹 3. Process order items and update stock
    for (const item of orderItems) {
      const { size, qnty, price, money, fileName } = item;
      const quantity = Number(qnty);

      // Update company stock
      const stockItem = stockUpdates.find(s => s.size === size);
      if (stockItem) {
        const newQuantity = parseInt(stockItem.companyStock.quantity) - quantity;
        
        await stockItem.companyStock.update(
          {
            quantity: newQuantity.toString(),
            money: (newQuantity * Number(stockItem.companyStock.price)).toString() // Assuming price is stored
          },
          { transaction }
        );
      }

      // Create order item
      const orderItem = await OrderItem.create(
        {
          size,
          qnty: quantity,
          price: Number(price),
          money: money ? Number(money) : quantity * Number(price),
          fileName,
          customerId,
        },
        { transaction }
      );

      createdOrderItems.push(orderItem);
    }

    // 🔹 4. Collect OrderItem IDs
    const orderItemIds = createdOrderItems.map((item) => item.id);

    // 🔹 5. Find or create Remain
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
          remainOrders: orderItemIds,
        },
        { transaction }
      );
    } else {
      await remain.update(
        {
          orderId: mergeUnique(remain.orderId, orderItemIds),
          remainOrders: mergeUnique(remain.remainOrders, orderItemIds),
        },
        { transaction }
      );
    }

    // 🔹 6. Log stock changes
    const stockChangeLogs = [];
    for (const update of stockUpdates) {
      stockChangeLogs.push({
        size: update.size,
        previousQuantity: parseInt(update.companyStock.quantity) + update.quantity,
        newQuantity: parseInt(update.companyStock.quantity),
        change: -update.quantity
      });
    }

    await transaction.commit();

    res.status(201).json({
      message: "Order created successfully and stock updated",
      customer: customerRecord,
      orderItems: createdOrderItems,
      remain,
      stockUpdates: stockChangeLogs,
      summary: {
        totalItemsOrdered: orderItems.reduce((sum, item) => sum + Number(item.qnty), 0),
        uniqueSizesOrdered: [...new Set(orderItems.map(item => item.size))],
        stockReduced: stockChangeLogs.reduce((sum, log) => sum + log.change, 0)
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating order:", error);

    // Determine appropriate status code
    let statusCode = 500;
    if (error.message.includes("not found") || error.message.includes("Insufficient stock")) {
      statusCode = 400;
    }

    res.status(statusCode).json({
      message: "Error creating order",
      error: error.message,
      details: error.message.includes("stock") ? 
        "Check available stock quantities before placing order" : 
        "Please verify all required fields are correct"
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

/* =====================================================
   GET ORDER ITEMS BY CUSTOMER AND TYPE
===================================================== */
/* =====================================================
   GET ORDER ITEMS BY CUSTOMER AND TYPE
===================================================== */
export const getCustomerOrdersByType = async (req, res) => {
  try {
    const { customerId, type } = req.params;

    if (!customerId || !type) {
      return res.status(400).json({
        success: false,
        message: "customerId and type are required",
      });
    }

    // Validate type parameter
    const validTypes = ['orderId', 'remainOrders', 'receiptOrders'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid type. Must be one of: orderId, remainOrders, receiptOrders",
        validTypes,
      });
    }

    /* =====================================================
       1. Find Remain record by customerId
    ===================================================== */
    const remain = await Remain.findOne({
      where: { customerId },
    });

    if (!remain) {
      return res.status(404).json({
        success: false,
        message: "No customer record found",
        customerId,
        type,
      });
    }

    /* =====================================================
       2. Get requested property
    ===================================================== */
    let orderIds = [];

    switch (type) {
      case 'orderId':
        orderIds = remain.orderId || [];
        break;
      case 'remainOrders':
        orderIds = remain.remainOrders || [];
        break;
      case 'receiptOrders':
        orderIds = remain.receiptOrders || [];
        break;
    }

    // If no order IDs found for the requested type
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: `No ${type} found for this customer`,
        customerId,
        type,
        orderIds: [],
        items: [],
      });
    }

    /* =====================================================
       3. Find OrderItems using orderIds
    ===================================================== */
    const orderItems = await OrderItem.findAll({
      where: {
        id: orderIds,
      },
      order: [['id', 'DESC']], // Latest first
    });

    /* =====================================================
       4. Get customer information separately
    ===================================================== */
    let customerInfo = null;
    try {
      customerInfo = await Customer.findByPk(customerId, {
        attributes: ['id', 'fullname', 'phoneNumber']
      });
    } catch (err) {
      console.log("Customer not found, continuing without customer info");
    }

    /* =====================================================
       5. Format response
    ===================================================== */
    const formattedItems = orderItems.map(item => ({
      id: item.id,
      customerId: item.customerId,
      customerName: customerInfo?.fullname || null,
      fileName: item.fileName ,
      size: item.size ,
      money: parseFloat(item.money || 0),
      receipt: parseFloat(item.receipt || 0),
      remaining: parseFloat(item.money || 0) - parseFloat(item.receipt || 0),
      qnty: parseFloat(item.qnty || 0),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    // Calculate totals
    const totalMoney = formattedItems.reduce((sum, item) => sum + item.money, 0);
    const totalReceipt = formattedItems.reduce((sum, item) => sum + item.receipt, 0);
    const totalRemaining = formattedItems.reduce((sum, item) => sum + item.remaining, 0);

    return res.status(200).json({
      success: true,
      message: `${type} retrieved successfully`,
      customerId,
      type,
      customerName: customerInfo?.fullname || null,
      customerInfo: customerInfo || null,
      orderIds,
      totalCount: orderItems.length,
      totalMoney,
      totalReceipt,
      totalRemaining,
      items: formattedItems,
      summary: {
        paid: formattedItems.filter(item => item.status === 'paid').length,
        unpaid: formattedItems.filter(item => item.status === 'unpaid').length,
      },
    });

  } catch (error) {
    console.error("Error in getCustomerOrdersByType:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
