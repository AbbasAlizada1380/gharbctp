import express from 'express';
import {
  createReceipt,
  getAllReceipts,
  getReceiptById,
  getReceiptsByCustomer,
  updateReceipt,
  deleteReceipt,
  getReceiptStatistics,
  getCustomerPaymentSummary
} from '../Controllers/ReceiptController.js';

const ReceiptRoute = express.Router();

ReceiptRoute.post('/', createReceipt);
ReceiptRoute.get('/', getAllReceipts);
ReceiptRoute.get('/statistics', getReceiptStatistics);
ReceiptRoute.get('/customer-summary/:customerId', getCustomerPaymentSummary);
ReceiptRoute.get('/customer/:customerId', getReceiptsByCustomer);
ReceiptRoute.get('/:id', getReceiptById);
ReceiptRoute.put('/:id', updateReceipt);
ReceiptRoute.delete('/:id', deleteReceipt);

export default ReceiptRoute;
