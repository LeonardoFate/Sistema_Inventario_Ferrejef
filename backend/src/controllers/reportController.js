import { query } from '../config/database.js';

// Reporte de Ventas Diarias
export const getDailySalesReport = async (req, res) => {
    try {
        const { date } = req.query;
        const currentDate = date || new Date().toISOString().split('T')[0];

        const result = await query(`
            SELECT
                s.id as sale_id,
                s.sale_date,
                s.total_amount,
                c.name as client_name,
                u.username as seller,
                json_agg(json_build_object(
                    'product_name', p.name,
                    'quantity', sd.quantity,
                    'unit_price', sd.unit_price,
                    'total_price', sd.total_price
                )) as products
            FROM sales s
            LEFT JOIN clients c ON s.client_id = c.id
            LEFT JOIN users u ON s.user_id = u.id
            LEFT JOIN sale_details sd ON s.id = sd.sale_id
            LEFT JOIN products p ON sd.product_id = p.id
            WHERE DATE(s.sale_date) = $1
            GROUP BY s.id, c.name, u.username
            ORDER BY s.sale_date DESC
        `, [currentDate]);

        const totalAmount = result.rows.reduce((acc, curr) => acc + parseFloat(curr.total_amount), 0);

        res.json({
            success: true,
            data: {
                date: currentDate,
                total_sales: result.rows.length,
                total_amount: totalAmount,
                sales: result.rows
            }
        });
    } catch (error) {
        console.error('Error en reporte de ventas diarias:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte de ventas diarias'
        });
    }
};

// Reporte de Inventario
export const getInventoryReport = async (req, res) => {
    try {
        const result = await query(`
            SELECT
                p.id,
                p.name,
                c.name as category,
                p.stock,
                p.min_stock,
                p.purchase_price,
                p.sale_price,
                (p.sale_price - p.purchase_price) as profit_margin,
                CASE
                    WHEN p.stock <= p.min_stock THEN true
                    ELSE false
                END as needs_restock,
                p.updated_at as last_updated
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY
                CASE WHEN p.stock <= p.min_stock THEN 0 ELSE 1 END,
                c.name,
                p.name
        `);

        // Calcular estadísticas generales
        const stats = {
            total_products: result.rows.length,
            total_inventory_value: result.rows.reduce((acc, curr) =>
                acc + (curr.stock * curr.purchase_price), 0),
            low_stock_products: result.rows.filter(p => p.stock <= p.min_stock).length,
            total_categories: new Set(result.rows.map(p => p.category)).size
        };

        res.json({
            success: true,
            data: {
                statistics: stats,
                products: result.rows
            }
        });
    } catch (error) {
        console.error('Error en reporte de inventario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte de inventario'
        });
    }
};

// Reporte de Ventas Mensual
export const getMonthlySalesReport = async (req, res) => {
    try {
        const { year, month } = req.query;
        const currentDate = new Date();
        const reportYear = year || currentDate.getFullYear();
        const reportMonth = month || currentDate.getMonth() + 1;

        const result = await query(`
            WITH monthly_sales AS (
                SELECT
                    DATE(s.sale_date) as sale_date,
                    SUM(s.total_amount) as daily_total,
                    COUNT(DISTINCT s.id) as num_sales,
                    SUM(sd.quantity) as products_sold,
                    SUM(sd.quantity * (sd.unit_price - p.purchase_price)) as gross_profit
                FROM sales s
                JOIN sale_details sd ON s.id = sd.sale_id
                JOIN products p ON sd.product_id = p.id
                WHERE
                    EXTRACT(YEAR FROM s.sale_date) = $1 AND
                    EXTRACT(MONTH FROM s.sale_date) = $2
                GROUP BY DATE(s.sale_date)
                ORDER BY sale_date
            )
            SELECT
                *,
                SUM(daily_total) OVER () as monthly_total,
                SUM(num_sales) OVER () as total_sales,
                SUM(products_sold) OVER () as total_products,
                SUM(gross_profit) OVER () as total_profit
            FROM monthly_sales
        `, [reportYear, reportMonth]);

        // Si hay resultados, tomar los totales del primer registro
        const summary = result.rows.length > 0 ? {
            year: reportYear,
            month: reportMonth,
            total_sales: result.rows[0].total_sales,
            total_amount: result.rows[0].monthly_total,
            total_products_sold: result.rows[0].total_products,
            total_profit: result.rows[0].total_profit,
            average_daily_sales: result.rows[0].monthly_total / result.rows.length
        } : {
            year: reportYear,
            month: reportMonth,
            total_sales: 0,
            total_amount: 0,
            total_products_sold: 0,
            total_profit: 0,
            average_daily_sales: 0
        };

        res.json({
            success: true,
            data: {
                summary,
                daily_details: result.rows
            }
        });
    } catch (error) {
        console.error('Error en reporte mensual:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte mensual'
        });
    }
};

// Reporte de Productos Más Vendidos
export const getTopProductsReport = async (req, res) => {
    try {
        const { start_date, end_date, limit = 10 } = req.query;

        const result = await query(`
            SELECT
                p.id,
                p.name,
                c.name as category,
                SUM(sd.quantity) as total_quantity,
                SUM(sd.total_price) as total_sales,
                SUM(sd.quantity * (sd.unit_price - p.purchase_price)) as total_profit,
                COUNT(DISTINCT s.id) as number_of_sales
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            JOIN sale_details sd ON p.id = sd.product_id
            JOIN sales s ON sd.sale_id = s.id
            WHERE
                ($1::date IS NULL OR s.sale_date >= $1::date) AND
                ($2::date IS NULL OR s.sale_date <= $2::date)
            GROUP BY p.id, p.name, c.name
            ORDER BY total_quantity DESC
            LIMIT $3
        `, [start_date, end_date, limit]);

        res.json({
            success: true,
            data: {
                period: {
                    start_date: start_date || 'All time',
                    end_date: end_date || 'All time'
                },
                products: result.rows
            }
        });
    } catch (error) {
        console.error('Error en reporte de productos más vendidos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte de productos más vendidos'
        });
    }
};
