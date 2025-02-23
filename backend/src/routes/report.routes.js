import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import {
    getDailySalesReport,
    getInventoryReport,
    getMonthlySalesReport,
    getTopProductsReport
} from '../controllers/reportController.js';

const router = express.Router();

// Aplicar middleware de autenticación
router.use(authenticateToken);

// Rutas de reportes
router.get('/daily-sales', getDailySalesReport);
router.get('/inventory', getInventoryReport);
router.get('/monthly-sales', getMonthlySalesReport);
router.get('/top-products', getTopProductsReport);

export default router;
