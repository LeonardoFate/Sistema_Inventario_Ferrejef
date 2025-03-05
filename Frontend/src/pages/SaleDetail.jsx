import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function SaleDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [sale, setSale] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSaleDetail();
    }, [id]);

    const fetchSaleDetail = async () => {
        try {
            const response = await api.get(`/sales/${id}`);
            setSale(response.data.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching sale details:', error);
            setError('Error al cargar los detalles de la venta');
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-EC', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };


    if (loading) return <div>Cargando detalles de venta...</div>;
    if (error) return <div>{error}</div>;
    if (!sale) return <div>Venta no encontrada</div>;

    return (
        <div className="p-6 bg-gray-100 h-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">🧾 Detalle de Venta</h1>
                <button
                    onClick={() => navigate('/sales')}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                    Volver a Ventas
                </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <p className="text-gray-600">Fecha de Venta</p>
                        <p className="font-bold">{formatDate(sale.sale_date)}</p>
                    </div>
                    <div>
                        <p className="text-gray-600">Cliente</p>
                        <p className="font-bold">{sale.client_name || 'Cliente no especificado'}</p>
                    </div>
                </div>

                <h2 className="text-xl font-semibold mb-4">Productos</h2>
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-200 text-gray-700">
                            <th className="py-3 px-4 text-left">Producto</th>
                            <th className="py-3 px-4 text-left">Cantidad</th>
                            <th className="py-3 px-4 text-left">Precio Unitario</th>
                            <th className="py-3 px-4 text-left">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sale.products.map((product, index) => (
                            <tr key={index} className="border-b">
                                <td className="py-3 px-4">{product.product_name}</td>
                                <td className="py-3 px-4">{product.quantity}</td>
                                <td className="py-3 px-4">S/ {parseFloat(product.unit_price).toFixed(2)}</td>
                                <td className="py-3 px-4">S/ {parseFloat(product.total_price).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="mt-6 border-t pt-4">
                    <div className="flex justify-end">
                        <div className="w-1/3">
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-600">Subtotal:</span>
                                <span>S/ {parseFloat(sale.subtotal).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-600">IVA (12%):</span>
                                <span>S/ {parseFloat(sale.iva_12).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-xl">
                                <span>Total:</span>
                                <span>S/ {parseFloat(sale.total_amount).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
