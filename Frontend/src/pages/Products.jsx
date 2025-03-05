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
        sale_price: '',
        profit_percentage: '' // Nuevo campo
    });
    const [categories, setCategories] = useState([]);
    const [priceMode, setPriceMode] = useState('sale_price'); // 'sale_price' o 'profit_percentage'

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

    // Función para calcular precio de venta a partir del precio de compra y porcentaje
    const calculateSalePrice = (purchasePrice, profitPercentage) => {
        if (!purchasePrice || !profitPercentage) return '';
        const purchase = parseFloat(purchasePrice);
        const profit = parseFloat(profitPercentage);
        return (purchase * (1 + profit / 100)).toFixed(2);
    };

    // Función para calcular porcentaje de ganancia a partir de precios
    const calculateProfitPercentage = (purchasePrice, salePrice) => {
        if (!purchasePrice || !salePrice) return '';
        const purchase = parseFloat(purchasePrice);
        const sale = parseFloat(salePrice);
        if (purchase <= 0) return '';
        return (((sale / purchase) - 1) * 100).toFixed(2);
    };

    // Función para manejar cambios en el formulario
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProductForm(prev => {
            const updated = { ...prev, [name]: value };

            // Cálculos automáticos
            if (name === 'purchase_price') {
                if (priceMode === 'profit_percentage' && updated.profit_percentage) {
                    updated.sale_price = calculateSalePrice(value, updated.profit_percentage);
                } else if (priceMode === 'sale_price' && updated.sale_price) {
                    updated.profit_percentage = calculateProfitPercentage(value, updated.sale_price);
                }
            } else if (name === 'profit_percentage' && priceMode === 'profit_percentage') {
                updated.sale_price = calculateSalePrice(updated.purchase_price, value);
            } else if (name === 'sale_price' && priceMode === 'sale_price') {
                updated.profit_percentage = calculateProfitPercentage(updated.purchase_price, value);
            }

            return updated;
        });
    };

    // Función para cambiar entre modos de precio
    const handlePriceModeChange = (mode) => {
        setPriceMode(mode);

        // Recalcular el valor que corresponda según el nuevo modo
        if (mode === 'profit_percentage' && productForm.purchase_price && productForm.sale_price) {
            setProductForm(prev => ({
                ...prev,
                profit_percentage: calculateProfitPercentage(prev.purchase_price, prev.sale_price)
            }));
        } else if (mode === 'sale_price' && productForm.purchase_price && productForm.profit_percentage) {
            setProductForm(prev => ({
                ...prev,
                sale_price: calculateSalePrice(prev.purchase_price, prev.profit_percentage)
            }));
        }
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
            sale_price: '',
            profit_percentage: ''
        });
        setPriceMode('sale_price');
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
            sale_price: product.sale_price,
            profit_percentage: product.profit_percentage || ''
        });
        setPriceMode('sale_price');
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

        const dataToSend = { ...productForm };

        // Si estamos en modo porcentaje, podemos omitir el sale_price
        if (priceMode === 'profit_percentage') {
            // El backend calculará el sale_price
        } else {
            // El backend calculará el profit_percentage
            delete dataToSend.profit_percentage;
        }

        fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(dataToSend)
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
                                <th className="py-3 px-4 text-left">% Ganancia</th>
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
                                            {product.profit_percentage
                                                ? `${parseFloat(product.profit_percentage).toFixed(2)}%`
                                                : "-"}
                                        </td>
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
                                    <td colSpan="8" className="py-3 px-4 text-center text-gray-600">
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
                                <label className="block mb-2">Stock Mínimo</label>
                                <input
                                    type="number"
                                    name="min_stock"
                                    value={productForm.min_stock}
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

                            {/* Selector de modo de precio */}
                            <div className="mb-4">
                                <div className="flex border rounded">
                                    <button
                                        type="button"
                                        className={`flex-1 py-2 ${priceMode === 'sale_price' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-700'}`}
                                        onClick={() => handlePriceModeChange('sale_price')}
                                    >
                                        Precio Venta
                                    </button>
                                    <button
                                        type="button"
                                        className={`flex-1 py-2 ${priceMode === 'profit_percentage' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-700'}`}
                                        onClick={() => handlePriceModeChange('profit_percentage')}
                                    >
                                        % Ganancia
                                    </button>
                                </div>
                            </div>

                            {priceMode === 'sale_price' ? (
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
                                    {productForm.purchase_price && productForm.sale_price && (
                                        <p className="mt-1 text-sm text-gray-600">
                                            Ganancia: {calculateProfitPercentage(productForm.purchase_price, productForm.sale_price)}%
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="mb-4">
                                    <label className="block mb-2">Porcentaje de Ganancia (%)</label>
                                    <input
                                        type="number"
                                        name="profit_percentage"
                                        value={productForm.profit_percentage}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border rounded"
                                        step="0.01"
                                        min="0"
                                        required
                                    />
                                    {productForm.purchase_price && productForm.profit_percentage && (
                                        <p className="mt-1 text-sm text-gray-600">
                                            Precio de venta: S/ {calculateSalePrice(productForm.purchase_price, productForm.profit_percentage)}
                                        </p>
                                    )}
                                </div>
                            )}

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
