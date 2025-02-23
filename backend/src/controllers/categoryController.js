import { query } from '../config/database.js';

// Obtener todas las categorías
export const getCategories = async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM categories ORDER BY name ASC'
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error obteniendo categorías:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener categorías'
        });
    }
};

// Obtener una categoría por ID
export const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            'SELECT * FROM categories WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Categoría no encontrada'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error obteniendo categoría:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la categoría'
        });
    }
};

// Crear una nueva categoría
export const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de la categoría es requerido'
            });
        }

        // Verificar si ya existe una categoría con ese nombre
        const categoryExists = await query(
            'SELECT id FROM categories WHERE LOWER(name) = LOWER($1)',
            [name]
        );

        if (categoryExists.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una categoría con ese nombre'
            });
        }

        const result = await query(
            'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
            [name, description]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creando categoría:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear la categoría'
        });
    }
};

// Actualizar una categoría
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de la categoría es requerido'
            });
        }

        // Verificar si existe la categoría
        const categoryExists = await query(
            'SELECT id FROM categories WHERE id = $1',
            [id]
        );

        if (categoryExists.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Categoría no encontrada'
            });
        }

        // Verificar si el nuevo nombre ya existe (excluyendo la categoría actual)
        const nameExists = await query(
            'SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND id != $2',
            [name, id]
        );

        if (nameExists.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una categoría con ese nombre'
            });
        }

        const result = await query(
            'UPDATE categories SET name = $1, description = $2 WHERE id = $3 RETURNING *',
            [name, description, id]
        );

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error actualizando categoría:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la categoría'
        });
    }
};

// Eliminar una categoría
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si existe la categoría
        const categoryExists = await query(
            'SELECT id FROM categories WHERE id = $1',
            [id]
        );

        if (categoryExists.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Categoría no encontrada'
            });
        }

        // Verificar si hay productos asociados
        const productsExist = await query(
            'SELECT id FROM products WHERE category_id = $1 LIMIT 1',
            [id]
        );

        if (productsExist.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar la categoría porque tiene productos asociados'
            });
        }

        await query('DELETE FROM categories WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'Categoría eliminada correctamente'
        });
    } catch (error) {
        console.error('Error eliminando categoría:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar la categoría'
        });
    }
};
