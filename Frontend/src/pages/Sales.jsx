import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Sales() {
    const navigate = useNavigate();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dateFilter, setDateFilter] = useState({
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        try {
            const response = await api.get('/sales');
            setSales(response.data.data || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching sales:', error);
            setError('Error al cargar las ventas');
            setLoading(false);
        }
    };

    const handleDateFilter = async () => {
        if (!dateFilter.startDate || !dateFilter.endDate) {
            setError('Por favor seleccione ambas fechas');
            return;
        }

        try {
            const response = await api.get('/sales/by-date', {
                params: {
                    start_date: dateFilter.startDate,
                    end_date: dateFilter.endDate
                }
            });
            setSales(response.data.data.sales || []);
        } catch (error) {
            console.error('Error filtering sales:', error);
            setError('Error al filtrar las ventas');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-EC', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    if (loading) return <div>Cargando ventas...</div>;

    return (
        <div className="p-6 bg-gray-100 h-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">📦 Ventas</h1>
                <button
                    onClick={() => navigate('/sales/new')}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    ➕ Nueva Venta
                </button>
            </div>

            {/* Filtro de fechas */}
            <div className="mb-6 bg-white p-4 rounded-lg shadow flex items-center space-x-4">
                <div className="flex-grow">
                    <label className="block text-sm font-medium text-gray-700">Fecha Inicio</label>
                    <input
                        type="date"
                        value={dateFilter.startDate}
                        onChange={(e) => setDateFilter(prev => ({
                            ...prev,
                            startDate: e.target.value
                        }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                </div>
                <div className="flex-grow">
                    <label className="block text-sm font-medium text-gray-700">Fecha Fin</label>
                    <input
                        type="date"
                        value={dateFilter.endDate}
                        onChange={(e) => setDateFilter(prev => ({
                            ...prev,
                            endDate: e.target.value
                        }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                </div>
                <button
                    onClick={handleDateFilter}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 self-end"
                >
                    Filtrar
                </button>
            </div>

            {/* Tabla de Ventas */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-200 text-gray-700">
                            <th className="py-3 px-4 text-left">#</th>
                            <th className="py-3 px-4 text-left">Fecha</th>
                            <th className="py-3 px-4 text-left">Cliente</th>
                            <th className="py-3 px-4 text-left">Total</th>
                            <th className="py-3 px-4 text-left">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.length > 0 ? (
                            sales.map((sale, index) => (
                                <tr key={sale.id} className="border-b hover:bg-gray-100">
                                    <td className="py-3 px-4">{index + 1}</td>
                                    <td className="py-3 px-4">
                                        {formatDate(sale.sale_date)}
                                    </td>
                                    <td className="py-3 px-4">
                                        {sale.client_name || 'Cliente no especificado'}
                                    </td>
                                    <td className="py-3 px-4 font-bold text-green-600">
                                        S/ {parseFloat(sale.total_amount).toFixed(2)}
                                    </td>
                                    <td className="py-3 px-4">
                                        <button
                                            className="text-blue-500 hover:underline mr-2"
                                            onClick={() => navigate(`/sales/${sale.id}`)}
                                        >
                                            Ver Detalle
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center py-4 text-gray-600">
                                    No hay ventas disponibles
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Manejo de errores */}
            {error && (
                <div className="mt-4 bg-red-50 p-4 rounded-md">
                    <p className="text-red-700">{error}</p>
                </div>
            )}
        </div>
    );
}
