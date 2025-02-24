import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function NewSale() {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [selectedClient, setSelectedClient] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Nuevo estado para el modal de productos
    const [showProductModal, setShowProductModal] = useState(false);
    const [productSearch, setProductSearch] = useState('');

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const [clientsResponse, productsResponse] = await Promise.all([
                api.get('/clients'),
                api.get('/products')
            ]);

            setClients(clientsResponse.data.data || []);
            setProducts(productsResponse.data.data || []);
            setFilteredProducts(productsResponse.data.data || []);
            setLoading(false);
        } catch (error) {
            setError('Error cargando datos necesarios');
            setLoading(false);
        }
    };

    // Nueva función para filtrar productos
    const handleProductSearch = (e) => {
        const searchTerm = e.target.value.toLowerCase();
        setProductSearch(searchTerm);

        const filtered = products.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.id.toString().includes(searchTerm)
        );

        setFilteredProducts(filtered);
    };

    // Modificar para abrir modal en lugar de agregar directo
    const openProductModal = () => {
        setShowProductModal(true);
        setProductSearch('');
        setFilteredProducts(products);
    };

    // Nueva función para agregar producto desde el modal
    const addProductFromModal = (product) => {
        const existingProductIndex = selectedProducts.findIndex(
            p => p.product_id === product.id
        );

        if (existingProductIndex > -1) {
            // Si el producto ya existe, incrementa la cantidad
            const updatedProducts = [...selectedProducts];
            updatedProducts[existingProductIndex].quantity += 1;
            setSelectedProducts(updatedProducts);
        } else {
            // Si es un producto nuevo
            setSelectedProducts([
                ...selectedProducts,
                {
                    product_id: product.id,
                    name: product.name,
                    quantity: 1,
                    unit_price: product.sale_price,
                    iva_type: '12' // Por defecto IVA 12%
                }
            ]);
        }

        setShowProductModal(false);
    };

    const handleQuantityChange = (index, quantity) => {
        const newProducts = [...selectedProducts];
        newProducts[index].quantity = Number(quantity);
        setSelectedProducts(newProducts);
    };

    const calculateTotals = () => {
        let subtotal = 0;
        let iva = 0;

        selectedProducts.forEach(item => {
            const lineTotal = item.quantity * item.unit_price;
            subtotal += lineTotal;
            if (item.iva_type === '12') {
                iva += lineTotal * 0.12;
            }
        });

        return {
            subtotal: subtotal.toFixed(2),
            iva: iva.toFixed(2),
            total: (subtotal + iva).toFixed(2)
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedClient || selectedProducts.length === 0) {
            setError('Por favor seleccione un cliente y al menos un producto');
            return;
        }

        try {
            const response = await api.post('/sales', {
                client_id: selectedClient,
                products: selectedProducts
            });

            if (response.data.success) {
                navigate('/sales');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Error al procesar la venta');
        }
    };

    if (loading) return <div>Cargando...</div>;

    const totals = calculateTotals();

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-900">Nueva Venta</h1>

            {error && (
                <div className="mt-4 bg-red-50 p-4 rounded-md">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                {/* Selección de Cliente */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Cliente
                    </label>
                    <select
                        value={selectedClient}
                        onChange={(e) => setSelectedClient(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value="">Seleccione un cliente</option>
                        {clients.map(client => (
                            <option key={client.id} value={client.id}>
                                {client.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Botón para abrir modal de productos */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Agregar Producto
                    </label>
                    <button
                        type="button"
                        onClick={openProductModal}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-blue-500 text-white p-2 hover:bg-blue-600"
                    >
                        🔍 Buscar Producto
                    </button>
                </div>

                {/* Lista de Productos Seleccionados */}
                <div className="mt-6">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Producto
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cantidad
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Precio Unit.
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Subtotal
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {selectedProducts.map((item, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                                            className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        ${item.unit_price}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        ${(item.quantity * item.unit_price).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totales */}
                <div className="mt-6 border-t border-gray-200 pt-4">
                    <dl className="space-y-2">
                        <div className="flex justify-between">
                            <dt className="text-sm font-medium text-gray-500">Subtotal</dt>
                            <dd className="text-sm font-medium text-gray-900">${totals.subtotal}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-sm font-medium text-gray-500">IVA (12%)</dt>
                            <dd className="text-sm font-medium text-gray-900">${totals.iva}</dd>
                        </div>
                        <div className="flex justify-between border-t border-gray-200 pt-2">
                            <dt className="text-base font-medium text-gray-900">Total</dt>
                            <dd className="text-base font-medium text-gray-900">${totals.total}</dd>
                        </div>
                    </dl>
                </div>

                {/* Botones */}
                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={() => navigate('/sales')}
                        className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Crear Venta
                    </button>
                </div>
            </form>

            {/* Modal de Productos */}
            {showProductModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg w-11/12 max-w-2xl max-h-[80vh] flex flex-col">
                        <div className="p-4 border-b">
                            <input
                                type="text"
                                placeholder="Buscar producto por nombre o código"
                                value={productSearch}
                                onChange={handleProductSearch}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div className="overflow-y-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-200">
                                        <th className="p-2">Código</th>
                                        <th className="p-2">Nombre</th>
                                        <th className="p-2">Precio</th>
                                        <th className="p-2">Stock</th>
                                        <th className="p-2">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map(product => (
                                        <tr key={product.id} className="border-b hover:bg-gray-100">
                                            <td className="p-2 text-center">{product.id}</td>
                                            <td className="p-2">{product.name}</td>
                                            <td className="p-2">S/ {product.sale_price}</td>
                                            <td className={`p-2 ${product.stock <= product.min_stock ? 'text-red-600' : 'text-green-600'}`}>
                                                {product.stock}
                                            </td>
                                            <td className="p-2">
                                                <button
                                                    onClick={() => addProductFromModal(product)}
                                                    className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                                                    disabled={product.stock === 0}
                                                >
                                                    Agregar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t">
                            <button
                                onClick={() => setShowProductModal(false)}
                                className="w-full bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
