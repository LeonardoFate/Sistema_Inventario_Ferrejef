import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import * as clientController from '../controllers/clientController.js';

const router = express.Router();

// Aplicar middleware de autenticación
router.use(authenticateToken);

// Rutas de clientes
router.get('/', clientController.getClients);
router.get('/:id', clientController.getClientById);
router.post('/', clientController.createClient);
router.put('/:id', clientController.updateClient);
router.delete('/:id', clientController.deleteClient);

export default router;
