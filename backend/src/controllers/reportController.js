import { query } from '../config/database.js';

// Reporte de Ventas Diarias con desglose de ganancias
export const getDailySalesReport = async (req, res) => {
    try {
        const { date } = req.query;
        const currentDate = date || new Date().toISOString().split('T')[0];

        const result = await query(`
            WITH sale_profits AS (
                SELECT
                    s.id as sale_id,
                    s.total_amount,
                    SUM(sd.quantity * p.purchase_price) as total_cost,
                    SUM(sd.quantity * (sd.unit_price - p.purchase_price)) as total_profit
                FROM sales s
                JOIN sale_details sd ON s.id = sd.sale_id
                JOIN products p ON sd.product_id = p.id
                WHERE DATE(s.sale_date) = $1
                GROUP BY s.id, s.total_amount
            )
            SELECT
                s.id as sale_id,
                s.sale_date,
                s.total_amount,
                c.name as client_name,
                u.username as seller,
                sp.total_cost,
                sp.total_profit,
                (sp.total_profit / NULLIF(sp.total_cost, 0) * 100) as profit_percentage,
                json_agg(json_build_object(
                    'product_id', p.id,
                    'product_name', p.name,
                    'quantity', sd.quantity,
                    'purchase_price', p.purchase_price,
                    'unit_price', sd.unit_price,
                    'total_price', sd.total_price,
                    'item_profit', (sd.unit_price - p.purchase_price) * sd.quantity,
                    'item_profit_percentage', p.profit_percentage
                )) as products
            FROM sales s
            JOIN sale_profits sp ON s.id = sp.sale_id
            LEFT JOIN clients c ON s.client_id = c.id
            LEFT JOIN users u ON s.user_id = u.id
            LEFT JOIN sale_details sd ON s.id = sd.sale_id
            LEFT JOIN products p ON sd.product_id = p.id
            WHERE DATE(s.sale_date) = $1
            GROUP BY s.id, c.name, u.username, sp.total_cost, sp.total_profit
            ORDER BY s.sale_date DESC
        `, [currentDate]);

        // Calcular totales
        let totalSales = 0;
        let totalRevenue = 0;
        let totalCost = 0;
        let totalProfit = 0;

        if (result.rows.length > 0) {
            totalSales = result.rows.length;
            totalRevenue = result.rows.reduce((sum, row) => sum + parseFloat(row.total_amount), 0);
            totalCost = result.rows.reduce((sum, row) => sum + parseFloat(row.total_cost || 0), 0);
            totalProfit = result.rows.reduce((sum, row) => sum + parseFloat(row.total_profit || 0), 0);
        }

        const averageProfitPercentage = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

        res.json({
            success: true,
            data: {
                date: currentDate,
                summary: {
                    total_sales: totalSales,
                    total_revenue: parseFloat(totalRevenue.toFixed(2)),
                    total_cost: parseFloat(totalCost.toFixed(2)),
                    total_profit: parseFloat(totalProfit.toFixed(2)),
                    profit_percentage: parseFloat(averageProfitPercentage.toFixed(2))
                },
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
                p.profit_percentage,
                (p.sale_price - p.purchase_price) as profit_margin,
                (p.stock * p.purchase_price) as stock_value,
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
                acc + parseFloat(curr.stock * curr.purchase_price), 0),
            total_potential_revenue: result.rows.reduce((acc, curr) =>
                acc + parseFloat(curr.stock * curr.sale_price), 0),
            total_potential_profit: result.rows.reduce((acc, curr) =>
                acc + parseFloat(curr.stock * (curr.sale_price - curr.purchase_price)), 0),
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

// Reporte de Ventas Mensual con ganancias
export const getMonthlySalesReport = async (req, res) => {
    try {
        const { year, month } = req.query;
        const currentDate = new Date();
        const reportYear = year || currentDate.getFullYear();
        const reportMonth = month || currentDate.getMonth() + 1;

        const result = await query(`
            WITH daily_profits AS (
                SELECT
                    DATE(s.sale_date) as sale_date,
                    SUM(s.total_amount) as daily_revenue,
                    COUNT(DISTINCT s.id) as num_sales,
                    SUM(sd.quantity) as products_sold,
                    SUM(sd.quantity * p.purchase_price) as daily_cost,
                    SUM(sd.quantity * (sd.unit_price - p.purchase_price)) as daily_profit
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
                (daily_profit / NULLIF(daily_cost, 0) * 100) as profit_percentage,
                SUM(daily_revenue) OVER () as monthly_revenue,
                SUM(daily_cost) OVER () as monthly_cost,
                SUM(daily_profit) OVER () as monthly_profit,
                SUM(num_sales) OVER () as total_sales,
                SUM(products_sold) OVER () as total_products
            FROM daily_profits
        `, [reportYear, reportMonth]);

        // Si hay resultados, extraer los totales del primer registro
        let summary = {
            year: parseInt(reportYear),
            month: parseInt(reportMonth),
            total_sales: 0,
            total_revenue: 0,
            total_cost: 0,
            total_profit: 0,
            profit_percentage: 0,
            total_products_sold: 0
        };

        if (result.rows.length > 0) {
            const firstRow = result.rows[0];
            summary = {
                year: parseInt(reportYear),
                month: parseInt(reportMonth),
                total_sales: parseInt(firstRow.total_sales || 0),
                total_revenue: parseFloat(firstRow.monthly_revenue || 0),
                total_cost: parseFloat(firstRow.monthly_cost || 0),
                total_profit: parseFloat(firstRow.monthly_profit || 0),
                profit_percentage: firstRow.monthly_cost > 0 ?
                    (firstRow.monthly_profit / firstRow.monthly_cost * 100) : 0,
                total_products_sold: parseInt(firstRow.total_products || 0)
            };
        }

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

// Reporte de Productos Más Vendidos con ganancias
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
                SUM(sd.quantity * p.purchase_price) as total_cost,
                SUM(sd.quantity * (sd.unit_price - p.purchase_price)) as total_profit,
                (SUM(sd.quantity * (sd.unit_price - p.purchase_price)) /
                 NULLIF(SUM(sd.quantity * p.purchase_price), 0) * 100) as profit_percentage,
                COUNT(DISTINCT s.id) as number_of_sales,
                p.profit_percentage as target_profit_percentage
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            JOIN sale_details sd ON p.id = sd.product_id
            JOIN sales s ON sd.sale_id = s.id
            WHERE
                ($1::date IS NULL OR s.sale_date >= $1::date) AND
                ($2::date IS NULL OR s.sale_date <= $2::date)
            GROUP BY p.id, p.name, c.name, p.profit_percentage
            ORDER BY total_quantity DESC
            LIMIT $3
        `, [start_date, end_date, limit]);

        // Calcular totales y promedios
        const totalSales = result.rows.reduce((sum, product) =>
            sum + parseFloat(product.total_sales || 0), 0);
        const totalCost = result.rows.reduce((sum, product) =>
            sum + parseFloat(product.total_cost || 0), 0);
        const totalProfit = result.rows.reduce((sum, product) =>
            sum + parseFloat(product.total_profit || 0), 0);
        const averageProfit = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

        res.json({
            success: true,
            data: {
                period: {
                    start_date: start_date || 'All time',
                    end_date: end_date || 'All time'
                },
                summary: {
                    total_sales: totalSales,
                    total_cost: totalCost,
                    total_profit: totalProfit,
                    average_profit_percentage: averageProfit.toFixed(2)
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

// Reporte de Ganancias por Periodo
export const getProfitReport = async (req, res) => {
    try {
        const { start_date, end_date, group_by = 'day' } = req.query;

        if (!start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren fechas de inicio y fin'
            });
        }

        let timeFormat;
        let groupBy;

        // Configurar la agrupación según el parámetro
        switch (group_by) {
            case 'month':
                timeFormat = "TO_CHAR(s.sale_date, 'YYYY-MM')";
                groupBy = "TO_CHAR(s.sale_date, 'YYYY-MM')";
                break;
            case 'week':
                timeFormat = "TO_CHAR(s.sale_date, 'YYYY-IW')";
                groupBy = "TO_CHAR(s.sale_date, 'YYYY-IW')";
                break;
            case 'day':
            default:
                timeFormat = "TO_CHAR(s.sale_date, 'YYYY-MM-DD')";
                groupBy = "DATE(s.sale_date)";
                break;
        }

        const result = await query(`
            SELECT
                ${timeFormat} as period,
                SUM(s.total_amount) as revenue,
                SUM(sd.quantity * p.purchase_price) as cost,
                SUM(sd.quantity * (sd.unit_price - p.purchase_price)) as profit,
                (SUM(sd.quantity * (sd.unit_price - p.purchase_price)) /
                 NULLIF(SUM(sd.quantity * p.purchase_price), 0) * 100) as profit_percentage,
                COUNT(DISTINCT s.id) as num_sales,
                SUM(sd.quantity) as products_sold
            FROM sales s
            JOIN sale_details sd ON s.id = sd.sale_id
            JOIN products p ON sd.product_id = p.id
            WHERE s.sale_date BETWEEN $1::date AND $2::date
            GROUP BY ${groupBy}
            ORDER BY ${groupBy}
        `, [start_date, end_date]);

        // Calcular totales
        const totalRevenue = result.rows.reduce((sum, row) =>
            sum + parseFloat(row.revenue || 0), 0);
        const totalCost = result.rows.reduce((sum, row) =>
            sum + parseFloat(row.cost || 0), 0);
        const totalProfit = result.rows.reduce((sum, row) =>
            sum + parseFloat(row.profit || 0), 0);
        const averageProfit = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
        const totalSales = result.rows.reduce((sum, row) =>
            sum + parseInt(row.num_sales || 0), 0);
        const totalProducts = result.rows.reduce((sum, row) =>
            sum + parseInt(row.products_sold || 0), 0);

        res.json({
            success: true,
            data: {
                period: {
                    start_date,
                    end_date,
                    group_by
                },
                summary: {
                    total_revenue: parseFloat(totalRevenue.toFixed(2)),
                    total_cost: parseFloat(totalCost.toFixed(2)),
                    total_profit: parseFloat(totalProfit.toFixed(2)),
                    profit_percentage: parseFloat(averageProfit.toFixed(2)),
                    total_sales: totalSales,
                    total_products_sold: totalProducts
                },
                periods: result.rows
            }
        });
    } catch (error) {
        console.error('Error en reporte de ganancias:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte de ganancias'
        });
    }
};
