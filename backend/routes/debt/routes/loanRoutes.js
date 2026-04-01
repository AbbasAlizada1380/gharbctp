import express from "express";
import {
  createLoan,
  getActiveLoans,
  getClosedLoans,
  getLoanById,
  closeLoan,
} from "../../../Controllers/debt/loanController.js";
import { validateLoan } from "../../../middleware/validation.js";

const router = express.Router();

router.route("/").post(validateLoan, createLoan);

router.get("/active", getActiveLoans);
router.get("/closed", getClosedLoans);

router.route("/:id").get(getLoanById).put(closeLoan); // For manual closing

export default router;
