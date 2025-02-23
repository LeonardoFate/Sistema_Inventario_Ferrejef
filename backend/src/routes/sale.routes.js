import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import {
    createSale,
    getSales,
    getSaleById,
    getSalesByDate
} from '../controllers/saleController.js';

const router = express.Router();

// Aplicar middleware de autenticación
router.use(authenticateToken);

// Rutas de ventas
router.post('/', createSale);
router.get('/', getSales);
router.get('/by-date', getSalesByDate);
router.get('/:id', getSaleById);

export default router;
