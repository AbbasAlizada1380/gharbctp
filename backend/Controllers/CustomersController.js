import Customer from "../Models/Customers.js";
import Remain from "../Models/Remain.js";
import { Op } from "sequelize";

/* ===========================
   Create Customer
=========================== */
export const createCustomer = async (req, res) => {
  const transaction = await Customer.sequelize.transaction();
  try {
    const { fullname, phoneNumber, isActive, initialRemain } = req.body;

    if (!fullname) {
      return res.status(400).json({ message: "Full name is required" });
    }

    // Create customer within transaction
    const customer = await Customer.create({
      fullname,
      phoneNumber,
      isActive: isActive ?? true,
    }, { transaction });

    // Create initial Remain record for the customer
    const remain = await Remain.create({
      customerId: customer.id,
      orderId: initialRemain?.orderId || [], // Accept initial order IDs if provided
    }, { transaction });

    // Commit transaction
    await transaction.commit();

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: {
        customer,
        remain: {
          id: remain.id,
          customerId: remain.customerId,
          orderId: remain.orderId,
          createdAt: remain.createdAt
        }
      }
    });
  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    console.error(error);
    
    // Handle specific errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false,
        message: "Phone number already exists",
        error: error.errors.map(err => err.message)
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Error creating customer", 
      error: error.message 
    });
  }
};
export const getActiveCustomers = async (req, res) => {
  try {
    const activeCustomers = await Customer.findAll({
      where: { isActive: true }, // only active customers
      order: [["createdAt", "DESC"]],
    });

    res.json({
      customers: activeCustomers,
      total: activeCustomers.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching active customers",
      error: error.message,
    });
  }
};


/* ===========================
   Get Customers (Paginated)
=========================== */
export const getCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Customer.findAndCountAll({
      limit,
      offset,
      order: [["id", "DESC"]],
    });

    res.json({
      customers: rows,
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
      message: "Error fetching customers",
      error: error.message,
    });
  }
};


/* ===========================
   Get Customer by ID
=========================== */
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json(customer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching customer", error });
  }
};

/* ===========================
   Update Customer (PUT)
=========================== */
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullname, phoneNumber, isActive } = req.body;

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    await customer.update({
      fullname,
      phoneNumber,
      isActive,
    });

    res.json(customer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating customer", error });
  }
};

/* ===========================
   Partial Update (PATCH)
=========================== */
export const updateCustomerProperties = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    await customer.update(updateData);

    res.json(customer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating customer", error });
  }
};

/* ===========================
   Delete Customer
=========================== */
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    await customer.destroy();
    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting customer", error });
  }
};

/* ===========================
   Search Customers
=========================== */
export const searchCustomers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({ message: "عبارت جستجو الزامی است" });
    }

    const search = q.trim();

    const customers = await Customer.findAll({
      where: {
        [Op.or]: [
          { fullname: { [Op.like]: `%${search}%` } },
          { phoneNumber: { [Op.like]: `%${search}%` } },
        ],
      },
      order: [["createdAt", "DESC"]],
    });

    if (!customers.length) {
      return res.status(404).json({ message: "هیچ نتیجه‌ای یافت نشد" });
    }

    res.json(customers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "خطا در جستجو", error });
  }
};
