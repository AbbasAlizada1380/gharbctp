import express from "express";
import {
  makePayment,
  getLoanPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
} from "../../../Controllers/debt/paymentController.js";
import { validatePayment } from "../../../middleware/validation.js";

const router = express.Router();

router.route("/").post(validatePayment, makePayment);

router.get("/loan/:loanId", getLoanPayments);

router
  .route("/:id")
  .get(getPaymentById)
  .put(validatePayment, updatePayment)
  .delete(deletePayment);

export default router;
