import { query } from '../config/database.js';

// Obtener todos los productos
export const getProducts = async (req, res) => {
    try {
        const result = await query(`
            SELECT
                p.*,
                c.name as category_name,
                CASE
                    WHEN p.stock <= p.min_stock THEN true
                    ELSE false
                END as low_stock
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY p.name ASC
        `);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error obteniendo productos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos'
        });
    }
};

// Obtener un producto por ID
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(`
            SELECT
                p.*,
                c.name as category_name,
                CASE
                    WHEN p.stock <= p.min_stock THEN true
                    ELSE false
                END as low_stock
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error obteniendo producto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el producto'
        });
    }
};

// Crear un nuevo producto
export const createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            category_id,
            stock,
            min_stock,
            purchase_price,
            profit_percentage, // Nuevo campo: porcentaje de ganancia
            sale_price        // Ahora este campo es opcional
        } = req.body;

        // Validaciones básicas
        if (!name || !purchase_price) {
            return res.status(400).json({
                success: false,
                message: 'Nombre y precio de compra son requeridos'
            });
        }

        // Calcular precio de venta si se proporciona profit_percentage
        let calculated_sale_price = sale_price;
        if (profit_percentage && !sale_price) {
            calculated_sale_price = parseFloat(purchase_price) * (1 + parseFloat(profit_percentage) / 100);
            calculated_sale_price = parseFloat(calculated_sale_price.toFixed(2)); // Redondear a 2 decimales
        } else if (!sale_price) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar el precio de venta o el porcentaje de ganancia'
            });
        }

        // Validar que el precio de venta sea mayor al precio de compra
        if (calculated_sale_price <= parseFloat(purchase_price)) {
            return res.status(400).json({
                success: false,
                message: 'El precio de venta debe ser mayor al precio de compra'
            });
        }

        // Validar categoría si se proporciona
        if (category_id) {
            const categoryExists = await query(
                'SELECT id FROM categories WHERE id = $1',
                [category_id]
            );
            if (categoryExists.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'La categoría especificada no existe'
                });
            }
        }

        // Calcular el porcentaje de ganancia si no se proporcionó
        const final_profit_percentage = profit_percentage ||
            parseFloat((((calculated_sale_price / parseFloat(purchase_price)) - 1) * 100).toFixed(2));

        const result = await query(`
            INSERT INTO products (
                name, description, category_id, stock,
                min_stock, purchase_price, sale_price, profit_percentage
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [
            name,
            description,
            category_id,
            stock || 0,
            min_stock || 5,
            purchase_price,
            calculated_sale_price,
            final_profit_percentage
        ]);

        res.status(201).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creando producto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear el producto'
        });
    }
};

// Actualizar un producto
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            description,
            category_id,
            stock,
            min_stock,
            purchase_price,
            profit_percentage, // Nuevo campo
            sale_price
        } = req.body;

        // Verificar si el producto existe
        const productResult = await query(
            'SELECT * FROM products WHERE id = $1',
            [id]
        );

        if (productResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        const existingProduct = productResult.rows[0];

        // Determinar precio de compra efectivo
        const effectivePurchasePrice = purchase_price || existingProduct.purchase_price;

        // Calcular precio de venta si se modificó el % de ganancia
        let effectiveSalePrice = sale_price;
        let effectiveProfitPercentage = profit_percentage;

        if (profit_percentage && !sale_price) {
            // Si proporcionó % de ganancia pero no precio de venta, calculamos el precio
            effectiveSalePrice = parseFloat(effectivePurchasePrice) * (1 + parseFloat(profit_percentage) / 100);
            effectiveSalePrice = parseFloat(effectiveSalePrice.toFixed(2));
        } else if (sale_price && !profit_percentage) {
            // Si proporcionó precio de venta pero no % de ganancia, calculamos el %
            effectiveProfitPercentage = parseFloat((((parseFloat(sale_price) / parseFloat(effectivePurchasePrice)) - 1) * 100).toFixed(2));
        } else if (!sale_price && !profit_percentage) {
            // Si no proporcionó ninguno, mantenemos el precio de venta
            effectiveSalePrice = existingProduct.sale_price;
            effectiveProfitPercentage = existingProduct.profit_percentage;
        }

        // Validar que el precio de venta sea mayor al precio de compra
        if (effectiveSalePrice <= parseFloat(effectivePurchasePrice)) {
            return res.status(400).json({
                success: false,
                message: 'El precio de venta debe ser mayor al precio de compra'
            });
        }

        const result = await query(`
            UPDATE products
            SET
                name = COALESCE($1, name),
                description = COALESCE($2, description),
                category_id = COALESCE($3, category_id),
                stock = COALESCE($4, stock),
                min_stock = COALESCE($5, min_stock),
                purchase_price = COALESCE($6, purchase_price),
                sale_price = COALESCE($7, sale_price),
                profit_percentage = COALESCE($8, profit_percentage),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $9
            RETURNING *
        `, [
            name,
            description,
            category_id,
            stock,
            min_stock,
            purchase_price,
            effectiveSalePrice,
            effectiveProfitPercentage,
            id
        ]);

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error actualizando producto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el producto'
        });
    }
};

// Eliminar un producto
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si el producto existe
        const productExists = await query(
            'SELECT id FROM products WHERE id = $1',
            [id]
        );

        if (productExists.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        // Verificar si el producto tiene ventas asociadas
        const salesCheck = await query(
            'SELECT id FROM sale_details WHERE product_id = $1 LIMIT 1',
            [id]
        );

        if (salesCheck.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar el producto porque tiene ventas asociadas'
            });
        }

        await query('DELETE FROM products WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'Producto eliminado correctamente'
        });
    } catch (error) {
        console.error('Error eliminando producto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el producto'
        });
    }
};

// Obtener productos con bajo stock
export const getLowStockProducts = async (req, res) => {
    try {
        const result = await query(`
            SELECT
                p.*,
                c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.stock <= p.min_stock
            ORDER BY p.stock ASC
        `);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error obteniendo productos con bajo stock:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos con bajo stock'
        });
    }
};
