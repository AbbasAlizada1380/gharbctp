import OrderItem from "../Models/OrderItems.js";
import Customer from "../Models/Customers.js";
import { Op } from "sequelize";
import Receipt from "../Models/Receipt.js";
import sequelize from "../dbconnection.js";
import Remain from "../models/Remain.js";

export const createReceipt = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { customer, amount } = req.body;

    if (!customer || !amount) {
      return res.status(400).json({ message: "customer and amount are required" });
    }

    let remainingAmount = Number(amount);

    /* ----------------------------------
       1. Create Receipt
    ---------------------------------- */
    const receipt = await Receipt.create(
      {
        customer,
        amount,
      },
      { transaction: t }
    );

    /* ----------------------------------
       2. Find or Create Remain
    ---------------------------------- */
    const [remain] = await Remain.findOne({
      where: { customerId: customer },
      defaults: { orderId: [] },
      transaction: t,
    });

    /* ----------------------------------
       3. Find OrderItems with receipt < money
       ordered by smallest remaining amount
    ---------------------------------- */
    const orderItems = await OrderItem.findAll({
      where:id=remain,
      order: [
        [sequelize.literal(`(money - receipt)`), "ASC"],
      ],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    const updatedOrderIds = [];

    /* ----------------------------------
       4. Apply receipt amount to OrderItems
    ---------------------------------- */
    for (const item of orderItems) {
      if (remainingAmount <= 0) break;

      const money = Number(item.money);
      const currentReceipt = Number(item.receipt || 0);
      const remainingForItem = money - currentReceipt;

      const appliedAmount = Math.min(remainingForItem, remainingAmount);

      item.receipt = currentReceipt + appliedAmount;
      remainingAmount -= appliedAmount;

      await item.save({ transaction: t });

      updatedOrderIds.push(item.id);
    }

    /* ----------------------------------
       5. Save OrderItem IDs to Remain
    ---------------------------------- */
    if (updatedOrderIds.length > 0) {
      remain.addOrderIds(updatedOrderIds);
      await remain.save({ transaction: t });
    }

    await t.commit();

    return res.status(201).json({
      message: "Receipt added and applied successfully",
      receipt,
      appliedToOrders: updatedOrderIds,
      remainingUnappliedAmount: remainingAmount,
    });
  } catch (error) {
    await t.rollback();
    console.error(error);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};



/* =====================================================
   GET ALL receipts (from OrderItem)
===================================================== */
export const getAllReceipts = async (req, res) => {
  try {
    const { customerId, startDate, endDate } = req.query;

    const where = {};

    if (customerId) where.customerId = customerId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const items = await OrderItem.findAll({
      where,
      include: {
        model: Customer,
        attributes: ["id", "fullname"],
      },
      order: [["createdAt", "DESC"]],
    });

    const totalReceipt = items.reduce(
      (sum, i) => sum + parseFloat(i.receipt || 0),
      0
    );

    res.json({
      success: true,
      count: items.length,
      totalReceipt,
      data: items,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching receipts",
    });
  }
};

/* =====================================================
   GET receipt by ID
===================================================== */
export const getReceiptById = async (req, res) => {
  try {
    const item = await OrderItem.findByPk(req.params.id, {
      include: {
        model: Customer,
        attributes: ["id", "fullname"],
      },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

/* =====================================================
   GET receipts by customer
===================================================== */
export const getReceiptsByCustomer = async (req, res) => {
  try {
    const customerId = req.params.customerId;

    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const items = await OrderItem.findAll({
      where: { customerId },
      order: [["createdAt", "DESC"]],
    });

    const totalPaid = items.reduce(
      (sum, i) => sum + parseFloat(i.receipt || 0),
      0
    );

    res.json({
      success: true,
      customer: {
        id: customer.id,
        fullname: customer.fullname,
      },
      statistics: {
        totalOrders: items.length,
        totalPaid,
      },
      data: items,
    });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

/* =====================================================
   UPDATE receipt (update OrderItem)
===================================================== */
export const updateReceipt = async (req, res) => {
  try {
    const item = await OrderItem.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    await item.update(req.body);

    res.json({
      success: true,
      message: "Receipt updated successfully",
      data: item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating receipt",
    });
  }
};

/* =====================================================
   DELETE receipt
===================================================== */
export const deleteReceipt = async (req, res) => {
  try {
    const item = await OrderItem.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    await item.destroy();

    res.json({
      success: true,
      message: "Receipt deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

/* =====================================================
   RECEIPT STATISTICS (from OrderItem)
===================================================== */
export const getReceiptStatistics = async (req, res) => {
  try {
    const items = await OrderItem.findAll();

    const totalPaid = items.reduce(
      (sum, i) => sum + parseFloat(i.receipt || 0),
      0
    );

    const totalOrders = items.length;

    res.json({
      success: true,
      statistics: {
        totalOrders,
        totalPaid,
        averagePaid:
          totalOrders > 0 ? (totalPaid / totalOrders).toFixed(2) : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};
