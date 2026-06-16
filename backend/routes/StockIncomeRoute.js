import express from "express";
import {
  createIncome,
  getIncomes,
  getIncomeById,
  updateIncome,
  updateIncomeProperties,
  deleteIncome,
  batchCreateIncomes,
  getIncomesByFactorId
} from "../Controllers/stock/IncomeController.js";

const IncomeRoute = express.Router();

IncomeRoute.post("/batch", batchCreateIncomes);

// 🆕 Route to get all incomes for a specific factor
// Example: GET /api/incomes/by-factor/123?page=1&limit=20
IncomeRoute.get("/by-factor/:factorId", getIncomesByFactorId);

// Single income routes
IncomeRoute.patch("/:id", updateIncomeProperties);
IncomeRoute.post("/", createIncome);
IncomeRoute.get("/", getIncomes);
IncomeRoute.get("/:id", getIncomeById);
IncomeRoute.put("/:id", updateIncome);
IncomeRoute.delete("/:id", deleteIncome);

export default IncomeRoute;