import { useEffect, useState } from "react";

function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [productForm, setProductForm] = useState({
        name: '',
        description: '',
        category_id: '',
        stock: 0,
        min_stock: 5,
        purchase_price: '',
        sale_price: ''
    });
    const [categories, setCategories] = useState([]);

    // Función para obtener productos
    const fetchProducts = () => {
        const token = localStorage.getItem("token");

        fetch("http://localhost:3000/api/products", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("No autorizado o token inválido");
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    setProducts(data.data);
                } else {
                    console.error("Error al obtener productos:", data.message);
                }
                setLoading(false);
            })
            .catch(error => {
                console.error("Error en la petición:", error);
                setLoading(false);
            });
    };

    // Función para obtener categorías
    const fetchCategories = () => {
        const token = localStorage.getItem("token");

        fetch("http://localhost:3000/api/categories", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    setCategories(data.data);
                }
            })
            .catch(error => {
                console.error("Error al obtener categorías:", error);
            });
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    // Función para manejar cambios en el formulario
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProductForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Función para manejar agregar producto
    const handleAddProduct = () => {
        setCurrentProduct(null);
        setProductForm({
            name: '',
            description: '',
            category_id: '',
            stock: 0,
            min_stock: 5,
            purchase_price: '',
            sale_price: ''
        });
        setShowModal(true);
    };

    // Función para manejar editar producto
    const handleEditProduct = (product) => {
        setCurrentProduct(product);
        setProductForm({
            name: product.name,
            description: product.description || '',
            category_id: product.category_id || '',
            stock: product.stock || 0,
            min_stock: product.min_stock || 5,
            purchase_price: product.purchase_price,
            sale_price: product.sale_price
        });
        setShowModal(true);
    };

    // Función para enviar formulario (crear o editar)
    const handleSubmitProduct = (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        const url = currentProduct
            ? `http://localhost:3000/api/products/${currentProduct.id}`
            : "http://localhost:3000/api/products";
        const method = currentProduct ? "PUT" : "POST";

        fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(productForm)
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    fetchProducts();
                    setShowModal(false);
                    alert(currentProduct ? "Producto actualizado correctamente" : "Producto creado correctamente");
                } else {
                    alert(data.message || "Error al procesar el producto");
                }
            })
            .catch(error => {
                console.error("Error:", error);
                alert("Error al procesar el producto");
            });
    };
    // Función para manejar eliminación de producto
    const handleDeleteProduct = (productId) => {
        const token = localStorage.getItem("token");

        if (window.confirm("¿Estás seguro de que quieres eliminar este producto?")) {
            fetch(`http://localhost:3000/api/products/${productId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Recargar la lista de productos
                        fetchProducts();
                        alert("Producto eliminado correctamente");
                    } else {
                        alert(data.message || "Error al eliminar el producto");
                    }
                })
                .catch(error => {
                    console.error("Error:", error);
                    alert("Error al eliminar el producto");
                });
        }
    };

    return (
        <div className="p-6 bg-gray-100 h-full">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">📦 Productos</h1>
                <button
                    onClick={handleAddProduct}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    ➕ Agregar Producto
                </button>
            </div>

            {loading ? (
                <p className="mt-6 text-gray-600">Cargando productos...</p>
            ) : (
                <div className="mt-6 bg-white p-6 rounded-lg shadow">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-200 text-gray-700">
                                <th className="py-3 px-4 text-left">#</th>
                                <th className="py-3 px-4 text-left">Nombre</th>
                                <th className="py-3 px-4 text-left">Categoría</th>
                                <th className="py-3 px-4 text-left">Stock</th>
                                <th className="py-3 px-4 text-left">P.COMPRA</th>
                                <th className="py-3 px-4 text-left">P.VENTA</th>
                                <th className="py-3 px-4 text-left">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.length > 0 ? (
                                products.map((product, index) => (
                                    <tr key={product.id} className="border-b hover:bg-gray-100">
                                        <td className="py-3 px-4">{index + 1}</td>
                                        <td className="py-3 px-4">{product.name}</td>
                                        <td className="py-3 px-4">{product.category_name || "Sin categoría"}</td>
                                        <td className={`py-3 px-4 font-bold ${product.low_stock ? "text-red-600" : "text-green-600"
                                            }`}>
                                            {product.stock}
                                        </td>
                                        <td className="py-3 px-4">S/ {parseFloat(product.purchase_price).toFixed(2)}</td>
                                        <td className="py-3 px-4">S/ {parseFloat(product.sale_price).toFixed(2)}</td>
                                        <td className="py-3 px-4">
                                            <button
                                                onClick={() => handleEditProduct(product)}
                                                className="text-blue-500 hover:underline"
                                            >
                                                ✏️ Editar
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProduct(product.id)}
                                                className="text-red-500 hover:underline ml-4"
                                            >
                                                🗑️ Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="py-3 px-4 text-center text-gray-600">
                                        No hay productos disponibles
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h2 className="text-2xl mb-4">
                            {currentProduct ? "Editar Producto" : "Agregar Producto"}
                        </h2>
                        <form onSubmit={handleSubmitProduct}>
                            <div className="mb-4">
                                <label className="block mb-2">Nombre</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={productForm.name}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2">Descripción</label>
                                <textarea
                                    name="description"
                                    value={productForm.description}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2">Categoría</label>
                                <select
                                    name="category_id"
                                    value={productForm.category_id}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="">Seleccionar categoría</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2">Stock</label>
                                <input
                                    type="number"
                                    name="stock"
                                    value={productForm.stock}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                    min="0"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2">Precio de Compra</label>
                                <input
                                    type="number"
                                    name="purchase_price"
                                    value={productForm.purchase_price}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                    step="0.01"
                                    min="0"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2">Precio de Venta</label>
                                <input
                                    type="number"
                                    name="sale_price"
                                    value={productForm.sale_price}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                    step="0.01"
                                    min="0"
                                    required
                                />
                            </div>
                            <div className="flex justify-between">
                                <button
                                    type="submit"
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                >
                                    {currentProduct ? "Actualizar Producto" : "Agregar Producto"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Products;
