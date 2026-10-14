import OrderItem from "../Models/OrderItems.js";
import Customer from "../Models/Customers.js";
import Remain from "../Models/Remain.js";
import sequelize from "../dbconnection.js";
import CompanyStock from "../Models/CompanyStock.js";
import { Op } from "sequelize";

export const createOrderItem = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    let { customer, newCustomerName, orderItems, userId: bodyUserId } = req.body;

    console.log("Received data:", req.body);

    // ✅ Resolve the user making the request
    const userId = req.user?.id || bodyUserId;

    if (!userId) {
      await transaction.rollback();
      return res.status(401).json({
        message: "User is not authenticated",
      });
    }

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: "orderItems are required",
      });
    }

    let customerRecord = null;

    // 🔹 1. Find or create customer
    if (customer) {
      customerRecord = await Customer.findByPk(customer, { transaction });

      if (!customerRecord) {
        await transaction.rollback();
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
      await transaction.rollback();
      return res.status(400).json({
        message: "Either customer or newCustomerName is required",
      });
    }

    const customerId = customerRecord.id;

    // 🔹 1.5. Build a price lookup map from the customer's priceList
    const priceMap = new Map();
    if (Array.isArray(customerRecord.priceList)) {
      customerRecord.priceList.forEach((entry) => {
        if (entry && entry.size) {
          const key = entry.size.trim().replace(/\s+/g, " ");
          priceMap.set(key, Number(entry.price) || 0);
        }
      });
    }

    // 🔹 2. Validate each item (no stock check anymore)
    const createdOrderItems = [];

    for (const item of orderItems) {
      const { size, qnty, money, fileName, invoiceNumber } = item;

      if (!size || !qnty) {
        throw new Error("Each order item must have size and qnty");
      }

      const quantity = Number(qnty);
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error(`Invalid quantity: ${qnty}`);
      }

      const normalizedSize = size.trim().replace(/\s+/g, " ");

      let itemPrice;
      if (priceMap.has(normalizedSize)) {
        itemPrice = priceMap.get(normalizedSize);
      } else if (item.price !== undefined && item.price !== null) {
        itemPrice = Number(item.price);
      } else {
        throw new Error(
          `No price found for size "${size}" in customer's price list and no price provided`
        );
      }

      if (isNaN(itemPrice) || itemPrice <= 0) {
        throw new Error(
          `Invalid price for size ${size}. Make sure it's set in the customer's price list.`
        );
      }

      let orderItemMoney;
      if (money && !isNaN(Number(money)) && Number(money) > 0) {
        orderItemMoney = Number(money);
      } else {
        orderItemMoney = quantity * itemPrice;
      }

      // ✅ Create the order item WITHOUT touching stock.
      //    `approved` defaults to false in the model.
      const orderItem = await OrderItem.create(
        {
          size: normalizedSize,
          qnty: quantity,
          price: itemPrice,
          money: orderItemMoney,
          fileName: fileName || null,
          customerId,
          invoiceNumber: invoiceNumber || null,
          customerName: customerRecord.fullname,
          userId,
          approved: false, // 👈 pending approval
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

    await transaction.commit();

    res.status(201).json({
      message: "Order created successfully (pending approval)",
      customer: customerRecord,
      orderItems: createdOrderItems,
      remain,
      summary: {
        totalItemsOrdered: orderItems.reduce(
          (sum, item) => sum + Number(item.qnty),
          0
        ),
        uniqueSizesOrdered: [...new Set(orderItems.map((item) => item.size))],
        pendingApproval: createdOrderItems.length,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating order:", error);

    let statusCode = 500;
    if (
      error.message.includes("not found") ||
      error.message.includes("Invalid") ||
      error.message.includes("No price found") ||
      error.message.includes("price list")
    ) {
      statusCode = 400;
    }

    res.status(statusCode).json({
      message: "Error creating order",
      error: error.message,
      details:
        process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Helper at the top of the file
const normalizeSize = (s) => (s || "").trim().replace(/\s+/g, " ");

// Helper to find stock with normalization fallback
const findCompanyStockBySize = async (size, transaction) => {
  const normalized = normalizeSize(size);

  // 1. Fast path — exact match
  let stock = await CompanyStock.findOne({
    where: { size },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (stock) return stock;

  // 2. Slow path — try normalized match
  const all = await CompanyStock.findAll({
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  stock = all.find((s) => normalizeSize(s.size) === normalized);
  return stock || null;
};

export const approveOrderItems = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { orderItemIds } = req.body;

    if (!Array.isArray(orderItemIds) || orderItemIds.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: "orderItemIds must be a non-empty array",
      });
    }

    // 🔹 1. Load the order items
    const orderItems = await OrderItem.findAll({
      where: { id: orderItemIds },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!orderItems.length) {
      await transaction.rollback();
      return res.status(404).json({
        message: "No order items found for the provided IDs",
      });
    }

    // 🔹 2. Filter out ones that are already approved
    const pendingItems = orderItems.filter((item) => !item.approved);

    if (!pendingItems.length) {
      await transaction.rollback();
      return res.status(400).json({
        message: "All selected order items are already approved",
      });
    }

    // 🔹 3. Validate stock for all pending items first (fail fast)
    const stockUpdates = [];

    for (const item of pendingItems) {
      const size = normalizeSize(item.size);
      const quantity = Number(item.qnty);

      if (!size || isNaN(quantity) || quantity <= 0) {
        throw new Error(`Invalid order item data for id ${item.id}`);
      }

      const companyStock = await findCompanyStockBySize(size, transaction);

      if (!companyStock) {
        throw new Error(
          `Size "${size}" not found in company stock. Please make sure the stock sizes match exactly.`
        );
      }

      const currentStock = parseInt(companyStock.quantity);
      if (isNaN(currentStock)) {
        throw new Error(`Invalid stock quantity for size ${size}`);
      }

      if (currentStock < quantity) {
        throw new Error(
          `Insufficient stock for size ${size}. Available: ${currentStock}, Requested: ${quantity}`
        );
      }

      stockUpdates.push({ companyStock, quantity, size, orderItem: item });
    }

    // 🔹 4. Deduct stock and mark items approved
    const stockChangeLogs = [];

    for (const update of stockUpdates) {
      const currentQuantity = parseInt(update.companyStock.quantity);
      const newQuantity = currentQuantity - update.quantity;

      await update.companyStock.update(
        { quantity: newQuantity.toString() },
        { transaction }
      );

      await update.orderItem.update({ approved: true }, { transaction });

      stockChangeLogs.push({
        orderItemId: update.orderItem.id,
        size: update.size,
        previousQuantity: currentQuantity,
        newQuantity,
        change: -update.quantity,
      });
    }

    await transaction.commit();

    res.status(200).json({
      message: "Order items approved and stock updated",
      approvedCount: stockUpdates.length,
      skippedCount: orderItems.length - pendingItems.length,
      approvedItems: pendingItems.map((i) => i.id),
      stockUpdates: stockChangeLogs,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error approving order items:", error);

    let statusCode = 500;
    if (
      error.message.includes("not found") ||
      error.message.includes("Insufficient stock") ||
      error.message.includes("Invalid") ||
      error.message.includes("already approved")
    ) {
      statusCode = 400;
    }

    res.status(statusCode).json({
      message: "Error approving order items",
      error: error.message,
      details:
        process.env.NODE_ENV === "development" ? error.stack : undefined,
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

    // ✅ Resolve the user making the request
    const userId = req.user?.id || req.query.userId;
    const userRole = req.user?.role || req.query.role;

    if (!userId) {
      return res.status(401).json({
        message: "User is not authenticated",
      });
    }

    // 🔹 Build the where clause based on role
    const whereClause = {};

    if (userRole === "designer") {
      // Designer sees only their own order items
      whereClause.userId = userId;
    } else if (userRole === "admin") {
      // Admin sees all order items — no filter
    } else {
      // Any other role: restrict to their own items for safety
      whereClause.userId = userId;
    }

    const { count, rows } = await OrderItem.findAndCountAll({
      where: whereClause,
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
    const orderItemId = Number(id);

    if (!Number.isFinite(orderItemId)) {
      return res.status(400).json({ message: "Invalid order item id" });
    }

    /* ---------- 1. Find the order item ---------- */
    const item = await OrderItem.findByPk(orderItemId);
    if (!item) {
      return res.status(404).json({ message: "Order item not found" });
    }

    const customerId = item.customerId;

    /* ---------- 2. Delete the order item ---------- */
    await item.destroy();

    /* ---------- 3. Clean up the matching Remain row ----------
       Find the Remain record whose customerId matches the item's
       customerId, then strip the deleted item id from all three
       arrays: orderId, remainOrders, receiptOrders.              */
    if (customerId == null) {
      return res.json({
        message: "Order item deleted successfully",
        deletedOrderItemId: orderItemId,
        updatedRemains: [],
        note: "Order item had no customerId; no Remain row touched",
      });
    }

    const remain = await Remain.findOne({ where: { customerId } });

    if (!remain) {
      return res.json({
        message: "Order item deleted successfully",
        deletedOrderItemId: orderItemId,
        updatedRemains: [],
        note: "No Remain row found for this customer",
      });
    }

    let changed = false;

    // The model's getters already coerce to arrays, so we can
    // filter directly.
    const beforeOrderId = remain.orderId;
    const beforeRemainOrders = remain.remainOrders;
    const beforeReceiptOrders = remain.receiptOrders;

    remain.orderId = beforeOrderId.filter(
      (rid) => Number(rid) !== orderItemId
    );
    remain.remainOrders = beforeRemainOrders.filter(
      (rid) => Number(rid) !== orderItemId
    );
    remain.receiptOrders = beforeReceiptOrders.filter(
      (rid) => Number(rid) !== orderItemId
    );

    if (remain.orderId.length !== beforeOrderId.length) changed = true;
    if (remain.remainOrders.length !== beforeRemainOrders.length)
      changed = true;
    if (remain.receiptOrders.length !== beforeReceiptOrders.length)
      changed = true;

    if (changed) {
      const allEmpty =
        remain.orderId.length === 0 &&
        remain.remainOrders.length === 0 &&
        remain.receiptOrders.length === 0;

      if (allEmpty) {
        await remain.destroy();
      } else {
        await remain.save();
      }
    }

    res.json({
      message: "Order item deleted successfully",
      deletedOrderItemId: orderItemId,
      customerId,
      updatedRemains: changed ? [remain.id] : [],
      remainDeleted: changed && remain.isNewRecord === false ? false : undefined,
    });
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
    const formattedItems = orderItems.reverse().map(item => ({
      id: item.id,
      customerId: item.customerId,
      customerName: customerInfo?.fullname || null,
      fileName: item.fileName,
      size: item.size,
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

/* ===========================
   Simple Search Order Items
=========================== */
/* ===========================
   Simple Search Order Items
=========================== */
export const simpleSearchOrderItems = async (req, res) => {
  try {
    const { q, customerId } = req.query;

    console.log("🔍 Search request received:", { q, customerId }); // Debug log

    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Search query (q) is required"
      });
    }

    const searchTerm = q.trim();
    const numericSearch = parseInt(searchTerm);

    console.log("🔍 Parsed search term:", { searchTerm, numericSearch }); // Debug log

    const whereConditions = {};

    if (customerId) {
      whereConditions.customerId = customerId;
    }

    // Search by ID (exact) OR filename (partial)
    whereConditions[Op.or] = [
      { fileName: { [Op.like]: `%${searchTerm}%` } }
    ];

    // Only add numeric ID search if the term is actually a number
    if (!isNaN(numericSearch)) {
      whereConditions[Op.or].push({ id: numericSearch });
    }

    console.log("🔍 WHERE conditions:", JSON.stringify(whereConditions)); // Debug log

    const items = await OrderItem.findAll({
      where: whereConditions,
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ['id', 'fullname']
        }
      ],
      order: [["id", "DESC"]],
      limit: 50
    });

    console.log(`🔍 Found ${items.length} items`); // Debug log

    res.json({
      success: true,
      count: items.length,
      items: items.map(item => ({
        id: item.id,
        customerId: item.customerId,
        customerName: item.customer?.fullname,
        fileName: item.fileName,
        size: item.size,
        qnty: item.qnty,
        money: item.money,
        receipt: item.receipt,
        remaining: item.money - item.receipt,
        createdAt: item.createdAt
      }))
    });

  } catch (error) {
    console.error("❌ Error in simpleSearchOrderItems:", error);
    res.status(500).json({
      success: false,
      message: "Error searching order items",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
export const getOrderItemsByDateRange = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        message: "Both 'from' and 'to' dates are required",
      });
    }

    // Convert to proper date range
    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Set end date to end of day (23:59:59)
    toDate.setHours(23, 59, 59, 999);

    const orderItems = await OrderItem.findAll({
      where: {
        createdAt: {
          [Op.between]: [fromDate, toDate],
        },
      },
      include: [
        {
          model: Customer,
          as: "customer", // VERY IMPORTANT
          attributes: ["id", "fullname"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      message: "Order items fetched successfully",
      count: orderItems.length,
      data: orderItems,
    });
  } catch (error) {
    console.error("Error fetching order items by date:", error);

    res.status(500).json({
      message: "Error fetching order items",
      error: error.message,
    });
  }
};

/* ===========================
   Get Order Items by Customer ID and Date Range
=========================== */
export const getOrderItemsByCustomerAndDateRange = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { from, to } = req.query;

    // Validate required parameters
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required"
      });
    }

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: "Both 'from' and 'to' dates are required"
      });
    }

    // Validate customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    // Parse and validate dates
    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Please provide valid dates"
      });
    }

    // Set end date to end of day (23:59:59.999)
    toDate.setHours(23, 59, 59, 999);

    // Fetch order items for the customer within the date range
    const orderItems = await OrderItem.findAll({
      where: {
        customerId: customerId,
        createdAt: {
          [Op.between]: [fromDate, toDate]
        }
      },
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "fullname", "phoneNumber"]
        }
      ],
      order: [["createdAt", "DESC"]] // Most recent first
    });

    // Format the response items with calculated fields
    const formattedItems = orderItems.map(item => ({
      id: item.id,
      customerId: item.customerId,
      customerName: item.customer?.fullname || null,
      fileName: item.fileName,
      size: item.size,
      qnty: parseFloat(item.qnty || 0),
      price: parseFloat(item.price || 0),
      money: parseFloat(item.money || 0),
      receipt: parseFloat(item.receipt || 0),
      remaining: parseFloat(item.money || 0) - parseFloat(item.receipt || 0),
      invoiceNumber: item.invoiceNumber,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));

    // Calculate summary statistics
    const summary = {
      totalItems: formattedItems.length,
      totalQuantity: formattedItems.reduce((sum, item) => sum + item.qnty, 0),
      totalMoney: formattedItems.reduce((sum, item) => sum + item.money, 0),
      totalReceipt: formattedItems.reduce((sum, item) => sum + item.receipt, 0),
      totalRemaining: formattedItems.reduce((sum, item) => sum + item.remaining, 0),
      uniqueSizes: [...new Set(formattedItems.map(item => item.size))],
      averageOrderValue: formattedItems.length > 0
        ? formattedItems.reduce((sum, item) => sum + item.money, 0) / formattedItems.length
        : 0
    };

    // Group by date for daily breakdown (optional)
    const itemsByDate = formattedItems.reduce((acc, item) => {
      const date = new Date(item.createdAt).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          items: [],
          totalMoney: 0,
          totalQuantity: 0
        };
      }
      acc[date].items.push(item.id);
      acc[date].totalMoney += item.money;
      acc[date].totalQuantity += item.qnty;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      message: "Order items fetched successfully",
      data: {
        customer: {
          id: customer.id,
          fullname: customer.fullname,
          phoneNumber: customer.phoneNumber
        },
        dateRange: {
          from: fromDate.toISOString(),
          to: toDate.toISOString()
        },
        summary,
        dailyBreakdown: Object.values(itemsByDate),
        items: formattedItems
      }
    });

  } catch (error) {
    console.error("Error in getOrderItemsByCustomerAndDateRange:", error);

    res.status(500).json({
      success: false,
      message: "Error fetching order items",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};