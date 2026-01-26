import express from 'express';
import {
  generateCompleteReport,
  exportReport,
  getDashboardStats
} from '../Controllers/reportController.js';

const ReportRoute = express.Router();
// Report routes
ReportRoute.get('/', generateCompleteReport);
ReportRoute.get('/export', exportReport);
ReportRoute.get('/dashboard/stats', getDashboardStats);

export default ReportRoute;