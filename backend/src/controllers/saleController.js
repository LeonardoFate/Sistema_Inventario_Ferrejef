import pkg from 'pg';
const { Pool } = pkg;
import { query } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

// Crear una venta
export const createSale = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Iniciar transacción

        const { client_id, products } = req.body;
        const user_id = req.user.id; // Obtenido del token

        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere al menos un producto para la venta'
            });
        }

        // Calcular total y validar stock
        let total_amount = 0;
        for (const item of products) {
            const productResult = await client.query(
                'SELECT stock, sale_price FROM products WHERE id = $1',
                [item.product_id]
            );

            if (productResult.rows.length === 0) {
                throw new Error(`Producto ${item.product_id} no encontrado`);
            }

            const product = productResult.rows[0];
            if (product.stock < item.quantity) {
                throw new Error(`Stock insuficiente para el producto ${item.product_id}`);
            }

            total_amount += product.sale_price * item.quantity;
        }

        // Crear la venta
        const saleResult = await client.query(
            'INSERT INTO sales (client_id, user_id, total_amount) VALUES ($1, $2, $3) RETURNING *',
            [client_id, user_id, total_amount]
        );

        const sale = saleResult.rows[0];

        // Crear detalles de venta y actualizar stock
        for (const item of products) {
            const productResult = await client.query(
                'SELECT sale_price FROM products WHERE id = $1',
                [item.product_id]
            );

            const unit_price = productResult.rows[0].sale_price;
            const total_price = unit_price * item.quantity;

            // Insertar detalle de venta
            await client.query(
                'INSERT INTO sale_details (sale_id, product_id, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5)',
                [sale.id, item.product_id, item.quantity, unit_price, total_price]
            );

            // Actualizar stock
            await client.query(
                'UPDATE products SET stock = stock - $1 WHERE id = $2',
                [item.quantity, item.product_id]
            );
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            data: {
                ...sale,
                products: products
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en la venta:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al procesar la venta'
        });
    } finally {
        client.release();
    }
};

// Obtener todas las ventas
export const getSales = async (req, res) => {
    try {
        const result = await query(`
            SELECT
                s.*,
                c.name as client_name,
                u.username as seller_name
            FROM sales s
            LEFT JOIN clients c ON s.client_id = c.id
            LEFT JOIN users u ON s.user_id = u.id
            ORDER BY s.sale_date DESC
        `);

        // Obtener detalles para cada venta
        const sales = await Promise.all(result.rows.map(async (sale) => {
            const detailsResult = await query(`
                SELECT
                    sd.*,
                    p.name as product_name
                FROM sale_details sd
                JOIN products p ON sd.product_id = p.id
                WHERE sd.sale_id = $1
            `, [sale.id]);

            return {
                ...sale,
                details: detailsResult.rows
            };
        }));

        res.json({
            success: true,
            data: sales
        });
    } catch (error) {
        console.error('Error obteniendo ventas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las ventas'
        });
    }
};

// Obtener una venta específica
export const getSaleById = async (req, res) => {
    try {
        const { id } = req.params;

        const saleResult = await query(`
            SELECT
                s.*,
                c.name as client_name,
                u.username as seller_name
            FROM sales s
            LEFT JOIN clients c ON s.client_id = c.id
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.id = $1
        `, [id]);

        if (saleResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Venta no encontrada'
            });
        }

        const sale = saleResult.rows[0];

        // Obtener detalles de la venta
        const detailsResult = await query(`
            SELECT
                sd.*,
                p.name as product_name
            FROM sale_details sd
            JOIN products p ON sd.product_id = p.id
            WHERE sd.sale_id = $1
        `, [id]);

        res.json({
            success: true,
            data: {
                ...sale,
                details: detailsResult.rows
            }
        });
    } catch (error) {
        console.error('Error obteniendo venta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la venta'
        });
    }
};

// Obtener ventas por fecha
export const getSalesByDate = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        if (!start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren fechas de inicio y fin'
            });
        }

        const result = await query(`
            SELECT
                s.*,
                c.name as client_name,
                u.username as seller_name
            FROM sales s
            LEFT JOIN clients c ON s.client_id = c.id
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.sale_date::date BETWEEN $1::date AND $2::date
            ORDER BY s.sale_date DESC
        `, [start_date, end_date]);

        const sales = await Promise.all(result.rows.map(async (sale) => {
            const detailsResult = await query(`
                SELECT
                    sd.*,
                    p.name as product_name
                FROM sale_details sd
                JOIN products p ON sd.product_id = p.id
                WHERE sd.sale_id = $1
            `, [sale.id]);

            return {
                ...sale,
                details: detailsResult.rows
            };
        }));

        res.json({
            success: true,
            data: sales
        });
    } catch (error) {
        console.error('Error obteniendo ventas por fecha:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las ventas'
        });
    }
};
