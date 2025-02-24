import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function NewSale() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      setLoading(false);
    } catch (error) {
      setError('Error cargando datos necesarios');
      setLoading(false);
    }
  };

  const handleAddProduct = (productId) => {
    const product = products.find(p => p.id === productId);
    if (product) {
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

        {/* Selección de Productos */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Agregar Producto
          </label>
          <select
            onChange={(e) => handleAddProduct(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">Seleccione un producto</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name} - ${product.sale_price}
              </option>
            ))}
          </select>
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
    </div>
  );
}
