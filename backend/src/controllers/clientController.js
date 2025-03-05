import { query } from '../config/database.js';

// Función de validación
const validateIdentification = (identificationType, identification) => {
    if (identificationType === 'cedula') {
        // Validación de cédula ecuatoriana
        if (!/^\d{10}$/.test(identification)) {
            return false;
        }

        // Algoritmo de validación de cédula
        const digits = identification.split('').map(Number);
        const checkDigit = digits.pop();
        let sum = 0;

        for (let i = 0; i < digits.length; i++) {
            let value = digits[i];
            if (i % 2 === 0) {
                value *= 2;
                if (value > 9) {
                    value -= 9;
                }
            }
            sum += value;
        }

        const calculatedCheckDigit = (10 - (sum % 10)) % 10;
        return calculatedCheckDigit === checkDigit;
    } else if (identificationType === 'ruc') {
        // Validación de RUC (13 dígitos)
        if (!/^\d{13}$/.test(identification)) {
            return false;
        }

        // Validaciones adicionales de estructura de RUC
        const firstTwoDigits = parseInt(identification.substring(0, 2));
        if (firstTwoDigits < 1 || firstTwoDigits > 24) {
            return false;
        }

        return true;
    }

    return false;
};

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
        const {
            name,
            identificationType,
            identification,
            phone,
            email,
            address
        } = req.body;

        // Validaciones
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'El nombre del cliente es requerido'
            });
        }

        // Validar tipo de identificación
        if (!['cedula', 'ruc'].includes(identificationType)) {
            return res.status(400).json({
                success: false,
                message: 'Tipo de identificación inválido'
            });
        }

        // Validar número de identificación
        if (!validateIdentification(identificationType, identification)) {
            return res.status(400).json({
                success: false,
                message: `${identificationType.toUpperCase()} inválida`
            });
        }

        // Verificar que la identificación no exista ya
        const existingClient = await query(
            'SELECT id FROM clients WHERE identification = $1',
            [identification]
        );

        if (existingClient.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un cliente con esta identificación'
            });
        }

        // Insertar cliente
        const result = await query(
            `INSERT INTO clients (
                name,
                identification_type,
                identification,
                phone,
                email,
                address
            ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [
                name,
                identificationType,
                identification,
                phone,
                email,
                address
            ]
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
        const {
            name,
            identificationType,
            identification,
            phone,
            email,
            address
        } = req.body;

        // Validaciones
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'El nombre del cliente es requerido'
            });
        }

        // Validar tipo de identificación
        if (!['cedula', 'ruc'].includes(identificationType)) {
            return res.status(400).json({
                success: false,
                message: 'Tipo de identificación inválido'
            });
        }

        // Validar número de identificación
        if (!validateIdentification(identificationType, identification)) {
            return res.status(400).json({
                success: false,
                message: `${identificationType.toUpperCase()} inválida`
            });
        }

        const result = await query(
            `UPDATE clients
             SET
                name = $1,
                identification_type = $2,
                identification = $3,
                phone = $4,
                email = $5,
                address = $6
             WHERE id = $7
             RETURNING *`,
            [
                name,
                identificationType,
                identification,
                phone,
                email,
                address,
                id
            ]
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
