import express from "express";
import {
  createIncome,
  getIncomes,
  getIncomeById,
  updateIncome,
  updateIncomeProperties,
  deleteIncome,
  batchCreateIncomes,          // ✅ import the batch function
} from "../Controllers/stock/IncomeController.js";

const IncomeRoute = express.Router();

// ✅ Batch creation – must come before the root POST
IncomeRoute.post("/batch", batchCreateIncomes);

// Single income routes
IncomeRoute.patch("/:id", updateIncomeProperties);
IncomeRoute.post("/", createIncome);
IncomeRoute.get("/", getIncomes);
IncomeRoute.get("/:id", getIncomeById);
IncomeRoute.put("/:id", updateIncome);
IncomeRoute.delete("/:id", deleteIncome);

export default IncomeRoute;