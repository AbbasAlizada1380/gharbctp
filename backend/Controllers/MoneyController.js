import Money from "../Models/Money.js";
import Owner from "../Models/owners.js";

/**
 * Create (take money)
 */
export const createMoney = async (req, res) => {
  try {
    const { ownerId, amount } = req.body;

    if (!ownerId || amount === undefined) {
      return res.status(400).json({
        message: "ownerId and amount are required",
      });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than 0",
      });
    }

    const owner = await Owner.findByPk(ownerId);
    if (!owner) {
      return res.status(404).json({
        message: "Owner not found",
      });
    }

    const money = await Money.create({
      ownerId,
      amount,
    });

    res.status(201).json({
      message: "Money recorded successfully",
      money,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error creating money record",
      error: error.message,
    });
  }
};

/**
 * Get all money records
 */
export const getMoneyList = async (req, res) => {
  try {
    const moneyList = await Money.findAll({
      include: [
        {
          model: Owner,
          as: "owner",
          attributes: ["id", "name"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      moneyList,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching money records",
      error: error.message,
    });
  }
};

/**
 * Get money by ID
 */
export const getMoneyById = async (req, res) => {
  try {
    const { id } = req.params;

    const money = await Money.findByPk(id, {
      include: ["owner"],
    });

    if (!money) {
      return res.status(404).json({
        message: "Money record not found",
      });
    }

    res.status(200).json({
      money,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching money",
      error: error.message,
    });
  }
};

/**
 * Update money amount
 */
export const updateMoney = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const money = await Money.findByPk(id);
    if (!money) {
      return res.status(404).json({
        message: "Money record not found",
      });
    }

    if (amount !== undefined) {
      if (Number(amount) <= 0) {
        return res.status(400).json({
          message: "Amount must be greater than 0",
        });
      }
      money.amount = amount;
    }

    await money.save();

    res.status(200).json({
      message: "Money updated successfully",
      money,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating money",
      error: error.message,
    });
  }
};

/**
 * Delete money record
 */
export const deleteMoney = async (req, res) => {
  try {
    const { id } = req.params;

    const money = await Money.findByPk(id);
    if (!money) {
      return res.status(404).json({
        message: "Money record not found",
      });
    }

    await money.destroy();

    res.status(200).json({
      message: "Money deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting money",
      error: error.message,
    });
  }
};
