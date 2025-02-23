import { query } from '../config/database.js';

// Obtener todos los clientes
export const getClients = async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM clients ORDER BY name ASC'
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error obteniendo clientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener clientes'
        });
    }
};

// Obtener un cliente por ID
export const getClientById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            'SELECT * FROM clients WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error obteniendo cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el cliente'
        });
    }
};

// Crear un nuevo cliente
export const createClient = async (req, res) => {
    try {
        const { name, phone, email, address } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'El nombre del cliente es requerido'
            });
        }

        const result = await query(
            'INSERT INTO clients (name, phone, email, address) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, phone, email, address]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creando cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear el cliente'
        });
    }
};

// Actualizar un cliente
export const updateClient = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, email, address } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'El nombre del cliente es requerido'
            });
        }

        const result = await query(
            `UPDATE clients
             SET name = $1, phone = $2, email = $3, address = $4
             WHERE id = $5
             RETURNING *`,
            [name, phone, email, address, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error actualizando cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el cliente'
        });
    }
};

// Eliminar un cliente
export const deleteClient = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si el cliente tiene ventas asociadas
        const salesCheck = await query(
            'SELECT id FROM sales WHERE client_id = $1 LIMIT 1',
            [id]
        );

        if (salesCheck.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar el cliente porque tiene ventas asociadas'
            });
        }

        const result = await query(
            'DELETE FROM clients WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Cliente eliminado correctamente'
        });
    } catch (error) {
        console.error('Error eliminando cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el cliente'
        });
    }
};
