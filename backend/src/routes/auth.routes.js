import express from 'express';
import { login, register, verifyToken } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Rutas públicas
router.post('/login', login);
router.post('/register', register);

// Rutas protegidas
router.get('/verify', authenticateToken, verifyToken);

export default router;
