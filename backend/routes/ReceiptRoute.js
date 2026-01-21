import express from 'express';
import {
  createReceipt,
  getAllReceipts,
  getReceiptById,
  getReceiptsByCustomer,
  updateReceipt,
  deleteReceipt,
  getReceiptStatistics
} from '../Controllers/ReceiptController.js';

const ReceiptRoute = express.Router();

// Create a new receipt
ReceiptRoute.post('/', createReceipt);

// Get all receipts (with optional filtering)
ReceiptRoute.get('/', getAllReceipts);

// Get receipt statistics
ReceiptRoute.get('/statistics', getReceiptStatistics);

// Get receipts by customer
ReceiptRoute.get('/customer/:customerId', getReceiptsByCustomer);

// Get single receipt by ID
ReceiptRoute.get('/:id', getReceiptById);

// Update receipt
ReceiptRoute.put('/:id', updateReceipt);

// Delete receipt
ReceiptRoute.delete('/:id', deleteReceipt);

export default ReceiptRoute;