import { query } from '../config/database.js';

// Obtener todos los productos
export const getProducts = async (req, res) => {
    try {
        const result = await query(`
            SELECT p.*, c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY p.name ASC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting products:', error);
        res.status(500).json({ message: 'Error al obtener productos' });
    }
};

// Obtener un producto por ID
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(`
            SELECT p.*, c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error getting product:', error);
        res.status(500).json({ message: 'Error al obtener el producto' });
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
            sale_price
        } = req.body;

        // Validaciones básicas
        if (!name || !purchase_price || !sale_price) {
            return res.status(400).json({
                message: 'Nombre, precio de compra y precio de venta son requeridos'
            });
        }

        const result = await query(`
            INSERT INTO products (
                name, description, category_id, stock,
                min_stock, purchase_price, sale_price
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [
            name,
            description,
            category_id,
            stock || 0,
            min_stock || 5,
            purchase_price,
            sale_price
        ]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Error al crear el producto' });
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
            sale_price
        } = req.body;

        // Verificar si el producto existe
        const productExists = await query(
            'SELECT id FROM products WHERE id = $1',
            [id]
        );

        if (productExists.rows.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
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
                sale_price = COALESCE($7, sale_price)
            WHERE id = $8
            RETURNING *
        `, [
            name,
            description,
            category_id,
            stock,
            min_stock,
            purchase_price,
            sale_price,
            id
        ]);

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Error al actualizar el producto' });
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
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        // Verificar si el producto tiene ventas asociadas
        const salesCheck = await query(
            'SELECT id FROM sale_details WHERE product_id = $1 LIMIT 1',
            [id]
        );

        if (salesCheck.rows.length > 0) {
            return res.status(400).json({
                message: 'No se puede eliminar el producto porque tiene ventas asociadas'
            });
        }

        await query('DELETE FROM products WHERE id = $1', [id]);
        res.json({ message: 'Producto eliminado correctamente' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Error al eliminar el producto' });
    }
};

// Obtener productos con bajo stock
export const getLowStockProducts = async (req, res) => {
    try {
        const result = await query(`
            SELECT p.*, c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.stock <= p.min_stock
            ORDER BY p.stock ASC
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('Error getting low stock products:', error);
        res.status(500).json({ message: 'Error al obtener productos con bajo stock' });
    }
};
