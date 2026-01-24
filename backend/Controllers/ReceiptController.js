import OrderItem from "../Models/OrderItems.js";
import Customer from "../Models/Customers.js";
import { Op } from "sequelize";
import Receipt from "../Models/Receipt.js";
import sequelize from "../dbconnection.js";
import Remain from "../Models/Remain.js";

/* =====================================================
   CREATE RECEIPT (Distribute payment to unpaid orders)
===================================================== */
export const createReceipt = async (req, res) => {
  const { customer, amount } = req.body;

  if (!customer || !amount) {
    return res.status(400).json({
      message: "customer and amount are required",
    });
  }

  const payAmount = parseFloat(amount);
  const transaction = await sequelize.transaction();

  try {
    /* =====================================================
       1. Get Remain record by customerId
    ===================================================== */
    const remain = await Remain.findOne({
      where: { customerId: customer },
      transaction,
    });

    if (!remain || !remain.orderId || remain.orderId.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        message: "No remaining orders found for this customer",
      });
    }

    const allOrderIds = remain.orderId;
    const remainOrders = remain.remainOrders || [];
    const receiptOrders = remain.receiptOrders || [];

    /* =====================================================
       2. Find OrderItems using remainOrders (unpaid orders)
    ===================================================== */
    const orderItems = await OrderItem.findAll({
      where: { id: remainOrders },
      transaction,
    });

    if (!orderItems.length) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Order items not found",
      });
    }

    /* =====================================================
       3. Filter unpaid items (receipt < money)
    ===================================================== */
    const unpaidItems = orderItems
      .map(item => ({
        ...item.toJSON(),
        receipt: parseFloat(item.receipt || 0),
        money: parseFloat(item.money || 0),
      }))
      .filter(item => item.receipt < item.money);

    if (!unpaidItems.length) {
      await transaction.rollback();
      return res.status(400).json({
        message: "All orders are already fully paid",
      });
    }

    /* =====================================================
       4. Pay starting from minimal ID
    ===================================================== */
    unpaidItems.sort((a, b) => a.id - b.id);

    let remainingAmount = payAmount;
    const paymentDetails = [];
    const fullyPaidOrderIds = [];
    const updatedRemainOrders = [...remainOrders];
    const updatedReceiptOrders = [...receiptOrders];

    for (const item of unpaidItems) {
      if (remainingAmount <= 0) break;

      const remainingToPay = item.money - item.receipt;
      if (remainingToPay <= 0) continue;

      const payNow = Math.min(remainingToPay, remainingAmount);
      const newReceiptAmount = item.receipt + payNow;

      // Update OrderItem receipt
      await OrderItem.update(
        { receipt: newReceiptAmount },
        { where: { id: item.id }, transaction }
      );

      paymentDetails.push({
        orderId: item.id,
        paid: payNow,
        previousReceipt: item.receipt,
        newReceipt: newReceiptAmount,
        remaining: item.money - newReceiptAmount
      });

      remainingAmount -= payNow;

      // Check if order is fully paid
      const isFullyPaid = Math.abs(item.money - newReceiptAmount) < 0.01;

      if (isFullyPaid) {
        // Track fully paid order IDs
        fullyPaidOrderIds.push(item.id);

        // Remove from remainOrders array
        const index = updatedRemainOrders.indexOf(item.id);
        if (index > -1) {
          updatedRemainOrders.splice(index, 1);
        }

        // Add to receiptOrders array
        if (!updatedReceiptOrders.includes(item.id)) {
          updatedReceiptOrders.push(item.id);
        }
      }
    }

    /* =====================================================
       5. Update all three fields in Remain model
       IMPORTANT: Update orderId, remainOrders, and receiptOrders
    ===================================================== */
    // Remove receiptOrders from remainOrders
    const finalRemainOrders = updatedRemainOrders.filter(
      orderId => !updatedReceiptOrders.includes(orderId)
    );

    // orderId should contain ALL orders (remainOrders + receiptOrders)
    const allOrders = [...new Set([...finalRemainOrders, ...updatedReceiptOrders])];

    await Remain.update(
      {
        orderId: allOrders,           // All orders
        remainOrders: finalRemainOrders,  // Only unpaid orders
        receiptOrders: updatedReceiptOrders, // Only fully paid orders
      },
      { where: { customerId: customer }, transaction }
    );

    /* =====================================================
       6. Create Receipt record
    ===================================================== */
    const receiptRecord = await Receipt.create(
      {
        customer,
        amount: payAmount,
        paymentDetails: JSON.stringify(paymentDetails),
        remainingAmount: remainingAmount > 0 ? remainingAmount : 0,
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(201).json({
      message: "Receipt created successfully",
      receipt: receiptRecord,
      paymentDetails,
      distributedAmount: payAmount - remainingAmount,
      remainingAmount,
      fullyPaidOrderIds,
      orderId: allOrders,            // All orders
      remainOrders: finalRemainOrders,   // Only unpaid orders
      receiptOrders: updatedReceiptOrders, // Only fully paid orders
    });

  } catch (error) {
    await transaction.rollback();
    console.error(error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

/* =====================================================
   GET ALL RECEIPTS (from Receipt table)
===================================================== */
export const getAllReceipts = async (req, res) => {
  try {
    const { customerId, startDate, endDate, minAmount, maxAmount } = req.query;

    const where = {};

    if (customerId) where.customer = customerId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) where.amount[Op.gte] = parseFloat(minAmount);
      if (maxAmount) where.amount[Op.lte] = parseFloat(maxAmount);
    }

    const receipts = await Receipt.findAll({
      where,
      include: [{
        model: Customer,
        attributes: ["id", "fullname", "phoneNumber"],
      }],
      order: [["createdAt", "DESC"]],
    });

    const totalAmount = receipts.reduce((sum, receipt) =>
      sum + parseFloat(receipt.amount || 0), 0
    );

    res.json({
      success: true,
      count: receipts.length,
      totalAmount,
      data: receipts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching receipts",
      error: error.message,
    });
  }
};

/* =====================================================
   GET RECEIPT BY ID (from Receipt table)
===================================================== */
export const getReceiptById = async (req, res) => {
  try {
    const receipt = await Receipt.findByPk(req.params.id, {
      include: [{
        model: Customer,
        attributes: ["id", "fullname", "phoneNumber"],
      }],
    });

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    res.json({
      success: true,
      data: receipt,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching receipt",
      error: error.message,
    });
  }
};

/* =====================================================
   GET RECEIPTS BY CUSTOMER
===================================================== */
export const getReceiptsByCustomer = async (req, res) => {
  try {
    const customerId = req.params.customerId;

    // Check if customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Get receipts for this customer
    const receipts = await Receipt.findAll({
      where: { customer: customerId },
      order: [["createdAt", "DESC"]],
    });

    // Get all order items for this customer to calculate statistics
    const remain = await Remain.findOne({
      where: { customerId },
    });

    let totalOrderAmount = 0;
    let totalPaid = 0;
    let unpaidOrders = [];

    if (remain && remain.orderId && remain.orderId.length > 0) {
      const orderItems = await OrderItem.findAll({
        where: { id: remain.orderId },
      });

      orderItems.forEach(item => {
        const money = parseFloat(item.money || 0);
        const receipt = parseFloat(item.receipt || 0);
        totalOrderAmount += money;
        totalPaid += receipt;

        if (receipt < money) {
          unpaidOrders.push({
            id: item.id,
            size: item.size,
            money: money,
            paid: receipt,
            remaining: money - receipt,
          });
        }
      });
    }

    const totalReceiptAmount = receipts.reduce((sum, receipt) =>
      sum + parseFloat(receipt.amount || 0), 0
    );

    res.json({
      success: true,
      customer: {
        id: customer.id,
        fullname: customer.fullname,
        phoneNumber: customer.phoneNumber,
      },
      statistics: {
        totalReceipts: receipts.length,
        totalReceiptAmount,
        totalOrderAmount,
        totalPaid,
        remainingAmount: totalOrderAmount - totalPaid,
        unpaidOrdersCount: unpaidOrders.length,
      },
      unpaidOrders,
      receipts: receipts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching customer receipts",
      error: error.message,
    });
  }
};

/* =====================================================
   UPDATE RECEIPT (with payment redistribution)
===================================================== */
export const updateReceipt = async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;

  if (!amount) {
    return res.status(400).json({
      message: "Amount is required",
    });
  }

  const newAmount = parseFloat(amount);

  const transaction = await sequelize.transaction();

  try {
    // Get the original receipt
    const receipt = await Receipt.findByPk(id, { transaction });
    if (!receipt) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    const customerId = receipt.customer;
    const oldAmount = parseFloat(receipt.amount || 0);
    const amountDifference = newAmount - oldAmount;

    if (amountDifference === 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: "No changes to update",
      });
    }

    // Get customer's remain record
    const remain = await Remain.findOne({
      where: { customerId },
      transaction,
    });

    if (!remain || !remain.orderId || remain.orderId.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        message: "No orders found for this customer",
      });
    }

    if (amountDifference > 0) {
      // Adding more payment - distribute to unpaid orders
      const orderIds = remain.orderId;
      const orderItems = await OrderItem.findAll({
        where: { id: orderIds },
        transaction,
      });

      const unpaidItems = orderItems
        .map(item => ({
          ...item.toJSON(),
          receipt: parseFloat(item.receipt || 0),
          money: parseFloat(item.money || 0),
        }))
        .filter(item => item.receipt < item.money)
        .sort((a, b) => a.id - b.id);

      let remainingAmount = amountDifference;
      const newPaymentDetails = [];

      for (const item of unpaidItems) {
        if (remainingAmount <= 0) break;

        const remainingToPay = item.money - item.receipt;
        if (remainingToPay <= 0) continue;

        const payNow = Math.min(remainingToPay, remainingAmount);

        await OrderItem.update(
          {
            receipt: item.receipt + payNow,
          },
          {
            where: { id: item.id },
            transaction,
          }
        );

        newPaymentDetails.push({
          orderId: item.id,
          additionalPaid: payNow,
          newReceipt: item.receipt + payNow,
        });

        remainingAmount -= payNow;
      }

      // Update receipt
      const oldPaymentDetails = receipt.paymentDetails ? JSON.parse(receipt.paymentDetails) : [];
      const updatedPaymentDetails = [...oldPaymentDetails, ...newPaymentDetails];

      await receipt.update({
        amount: newAmount,
        paymentDetails: JSON.stringify(updatedPaymentDetails),
        remainingAmount: remainingAmount > 0 ? remainingAmount : 0,
      }, { transaction });

      await transaction.commit();

      return res.json({
        success: true,
        message: "Receipt updated with additional payment distributed",
        data: receipt,
        additionalPaymentDetails: newPaymentDetails,
        distributedAmount: amountDifference - remainingAmount,
        remainingAmount,
      });

    } else {
      // Reducing payment - need to handle carefully (optional: implement refund logic)
      await transaction.rollback();
      return res.status(400).json({
        message: "Reducing receipt amount is not supported. Please create a refund receipt instead.",
      });
    }

  } catch (error) {
    await transaction.rollback();
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error updating receipt",
      error: error.message,
    });
  }
};

/* =====================================================
   DELETE RECEIPT (with payment reversal)
===================================================== */
export const deleteReceipt = async (req, res) => {
  const { id } = req.params;

  const transaction = await sequelize.transaction();

  try {
    // Get the receipt
    const receipt = await Receipt.findByPk(id, { transaction });
    if (!receipt) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    const customerId = receipt.customer;
    const paymentDetails = receipt.paymentDetails ? JSON.parse(receipt.paymentDetails) : [];

    // If there are payment details, reverse the payments
    if (paymentDetails.length > 0) {
      for (const payment of paymentDetails) {
        const orderItem = await OrderItem.findByPk(payment.orderId, { transaction });
        if (orderItem) {
          const currentReceipt = parseFloat(orderItem.receipt || 0);
          const paidAmount = payment.paid || payment.additionalPaid || 0;

          // Subtract the paid amount from receipt field
          const newReceipt = Math.max(0, currentReceipt - paidAmount);

          await OrderItem.update(
            { receipt: newReceipt },
            {
              where: { id: payment.orderId },
              transaction,
            }
          );
        }
      }
    }

    // Delete the receipt record
    await receipt.destroy({ transaction });

    await transaction.commit();

    return res.json({
      success: true,
      message: "Receipt deleted and payments reversed successfully",
      deletedReceipt: receipt,
    });

  } catch (error) {
    await transaction.rollback();
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error deleting receipt",
      error: error.message,
    });
  }
};

/* =====================================================
   RECEIPT STATISTICS
===================================================== */
export const getReceiptStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    // Get all receipts
    const receipts = await Receipt.findAll({ where });

    // Get all customers for breakdown
    const customers = await Customer.findAll({
      include: [{
        model: Receipt,
        required: false,
      }],
    });

    // Calculate statistics
    const totalReceipts = receipts.length;
    const totalAmount = receipts.reduce((sum, receipt) =>
      sum + parseFloat(receipt.amount || 0), 0
    );
    const averageAmount = totalReceipts > 0 ? totalAmount / totalReceipts : 0;

    // Group by customer
    const customerStats = [];
    for (const customer of customers) {
      const customerReceipts = receipts.filter(r => r.customer === customer.id);
      const customerTotal = customerReceipts.reduce((sum, receipt) =>
        sum + parseFloat(receipt.amount || 0), 0
      );

      // Get customer's unpaid amount from orders
      let unpaidAmount = 0;
      const remain = await Remain.findOne({
        where: { customerId: customer.id },
      });

      if (remain && remain.orderId && remain.orderId.length > 0) {
        const orderItems = await OrderItem.findAll({
          where: { id: remain.orderId },
        });

        orderItems.forEach(item => {
          const money = parseFloat(item.money || 0);
          const receipt = parseFloat(item.receipt || 0);
          unpaidAmount += Math.max(0, money - receipt);
        });
      }

      customerStats.push({
        customerId: customer.id,
        customerName: customer.fullname,
        receiptCount: customerReceipts.length,
        totalPaid: customerTotal,
        unpaidAmount: unpaidAmount,
      });
    }

    // Daily statistics
    const dailyStats = {};
    receipts.forEach(receipt => {
      const date = receipt.createdAt.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          count: 0,
          totalAmount: 0,
        };
      }
      dailyStats[date].count++;
      dailyStats[date].totalAmount += parseFloat(receipt.amount);
    });

    res.json({
      success: true,
      statistics: {
        totalReceipts,
        totalAmount: totalAmount.toFixed(2),
        averageAmount: averageAmount.toFixed(2),
        byCustomer: customerStats,
        daily: Object.values(dailyStats),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching statistics",
      error: error.message,
    });
  }
};

/* =====================================================
   GET CUSTOMER PAYMENT SUMMARY
===================================================== */
export const getCustomerPaymentSummary = async (req, res) => {
  try {
    const { customerId } = req.params;

    // Check if customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Get customer's remain record
    const remain = await Remain.findOne({
      where: { customerId },
    });

    let totalOrderAmount = 0;
    let totalPaid = 0;
    let orderDetails = [];

    if (remain && remain.orderId && remain.orderId.length > 0) {
      const orderItems = await OrderItem.findAll({
        where: { id: remain.orderId },
      });

      orderDetails = orderItems.map(item => {
        const money = parseFloat(item.money || 0);
        const receipt = parseFloat(item.receipt || 0);
        totalOrderAmount += money;
        totalPaid += receipt;

        return {
          id: item.id,
          size: item.size,
          fileName: item.fileName,
          createdAt: item.createdAt,
          money: money,
          paid: receipt,
          remaining: money - receipt,
          status: receipt >= money ? "paid" : receipt > 0 ? "partial" : "unpaid",
        };
      });
    }

    // Get all receipts for this customer
    const receipts = await Receipt.findAll({
      where: { customer: customerId },
      order: [["createdAt", "DESC"]],
    });

    const totalReceiptAmount = receipts.reduce((sum, receipt) =>
      sum + parseFloat(receipt.amount || 0), 0
    );

    res.json({
      success: true,
      customer: {
        id: customer.id,
        fullname: customer.fullname,
        phoneNumber: customer.phoneNumber,
      },
      summary: {
        totalOrders: orderDetails.length,
        totalOrderAmount,
        totalPaid,
        remainingAmount: totalOrderAmount - totalPaid,
        totalReceipts: receipts.length,
        totalReceiptAmount,
      },
      orderDetails,
      receipts: receipts.map(r => ({
        id: r.id,
        amount: r.amount,
        createdAt: r.createdAt,
        paymentDetails: r.paymentDetails ? JSON.parse(r.paymentDetails) : [],
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching payment summary",
      error: error.message,
    });
  }
};