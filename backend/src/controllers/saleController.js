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

// Crear venta
export const createSale = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const {
            client_id,
            products,
            invoice_series,
            invoice_number,
            authorization_number,
            tax_status = 'DOCUMENTO SIN VALIDEZ TRIBUTARIA'
        } = req.body;

        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere al menos un producto'
            });
        }

        // Calcular totales
        let subtotal = 0;
        let iva_12 = 0;
        let iva_0 = 0;

        // Validar y calcular productos
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

            const itemSubtotal = product.sale_price * item.quantity;
            subtotal += itemSubtotal;

            if (item.iva_type === '0') {
                iva_0 += itemSubtotal;
            } else {
                iva_12 += itemSubtotal * 0;
            }
        }

        const total_amount = subtotal + iva_12;

        // Crear la venta
        const saleResult = await client.query(`
            INSERT INTO sales (
                client_id,
                user_id,
                invoice_series,
                invoice_number,
                authorization_number,
                total_amount,
                subtotal,
                iva_0,
                iva_12,
                tax_status,
                sale_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
            RETURNING *
        `, [
            client_id,
            req.user.id,
            invoice_series,
            invoice_number,
            authorization_number,
            total_amount,
            subtotal,
            iva_0,
            iva_12,
            tax_status
        ]);

        const sale = saleResult.rows[0];

        // Crear detalles de venta
        for (const item of products) {
            const productResult = await client.query(
                'SELECT name, sale_price FROM products WHERE id = $1',
                [item.product_id]
            );

            const product = productResult.rows[0];
            const total_price = product.sale_price * item.quantity;

            await client.query(`
                INSERT INTO sale_details (
                    sale_id,
                    product_id,
                    quantity,
                    unit_price,
                    total_price
                ) VALUES ($1, $2, $3, $4, $5)
            `, [
                sale.id,
                item.product_id,
                item.quantity,
                product.sale_price,
                total_price
            ]);

            // Actualizar stock
            await client.query(
                'UPDATE products SET stock = stock - $1 WHERE id = $2',
                [item.quantity, item.product_id]
            );
        }

        await client.query('COMMIT');

        // Obtener detalles completos con los nuevos campos de cliente
        const saleDetails = await query(`
            SELECT
                s.*,
                c.name as client_name,
                c.identification_type,
                c.identification,
                c.address,
                json_agg(
                    json_build_object(
                        'product_id', p.id,
                        'product_name', p.name,
                        'quantity', sd.quantity,
                        'unit_price', sd.unit_price,
                        'total_price', sd.total_price
                    )
                ) as products
            FROM sales s
            LEFT JOIN clients c ON s.client_id = c.id
            LEFT JOIN sale_details sd ON s.id = sd.sale_id
            LEFT JOIN products p ON sd.product_id = p.id
            WHERE s.id = $1
            GROUP BY s.id, c.name, c.identification_type, c.identification, c.address
        `, [sale.id]);

        res.status(201).json({
            success: true,
            data: saleDetails.rows[0]
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
                c.identification_type,
                c.identification,
                json_agg(
                    json_build_object(
                        'product_id', p.id,
                        'product_name', p.name,
                        'quantity', sd.quantity,
                        'unit_price', sd.unit_price,
                        'total_price', sd.total_price
                    )
                ) as products
            FROM sales s
            LEFT JOIN clients c ON s.client_id = c.id
            LEFT JOIN sale_details sd ON s.id = sd.sale_id
            LEFT JOIN products p ON sd.product_id = p.id
            GROUP BY s.id, c.name, c.identification_type, c.identification
            ORDER BY s.sale_date DESC
        `);

        res.json({
            success: true,
            data: result.rows
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

        const result = await query(`
            SELECT
                s.*,
                c.name as client_name,
                c.identification_type,
                c.identification,
                c.address,
                json_agg(
                    json_build_object(
                        'product_id', p.id,
                        'product_name', p.name,
                        'quantity', sd.quantity,
                        'unit_price', sd.unit_price,
                        'total_price', sd.total_price
                    )
                ) as products
            FROM sales s
            LEFT JOIN clients c ON s.client_id = c.id
            LEFT JOIN sale_details sd ON s.id = sd.sale_id
            LEFT JOIN products p ON sd.product_id = p.id
            WHERE s.id = $1
            GROUP BY s.id, c.name, c.identification_type, c.identification, c.address
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Venta no encontrada'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error obteniendo venta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la venta',
            errorDetails: error.message
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
                c.identification_type,
                c.identification,
                c.address,
                json_agg(
                    json_build_object(
                        'product_id', p.id,
                        'product_name', p.name,
                        'quantity', sd.quantity,
                        'unit_price', sd.unit_price,
                        'total_price', sd.total_price
                    )
                ) as products
            FROM sales s
            LEFT JOIN clients c ON s.client_id = c.id
            LEFT JOIN sale_details sd ON s.id = sd.sale_id
            LEFT JOIN products p ON sd.product_id = p.id
            WHERE s.sale_date::date BETWEEN $1::date AND $2::date
            GROUP BY s.id, c.name, c.identification_type, c.identification, c.address
            ORDER BY s.sale_date DESC
        `, [start_date, end_date]);

        const summary = {
            total_sales: result.rows.length,
            total_amount: result.rows.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0),
            start_date,
            end_date
        };

        res.json({
            success: true,
            data: {
                summary,
                sales: result.rows
            }
        });
    } catch (error) {
        console.error('Error obteniendo ventas por fecha:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las ventas por fecha'
        });
    }
};
