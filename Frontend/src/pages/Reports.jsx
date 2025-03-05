import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Reports() {
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateReport = async () => {
    setLoading(true);
    setError(null);

    try {
      let response;

      switch (reportType) {
        case 'sales':
          response = await api.get(`/reports/daily-sales?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`);
          break;
        case 'inventory':
          response = await api.get('/reports/inventory');
          break;
        case 'low-stock':
          response = await api.get('/products/low-stock');
          break;
        default:
          response = await api.get('/reports/monthly-sales');
      }

      setReport(response.data.data);
    } catch (err) {
      console.error('Error generando reporte:', err);
      setError('Error al generar el reporte. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Renderizar el reporte según el tipo
  const renderReport = () => {
    if (!report) return null;

    switch (reportType) {
      case 'sales':
        return (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h5 className="text-lg font-semibold text-gray-700">Reporte de Ventas</h5>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h6 className="text-sm font-medium text-gray-500">Total Ventas</h6>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {report.summary?.total_sales || 0}
                  </h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h6 className="text-sm font-medium text-gray-500">Ingresos</h6>
                  <h3 className="text-2xl font-bold text-blue-600">
                    ${report.summary?.total_revenue?.toFixed(2) || 0}
                  </h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h6 className="text-sm font-medium text-gray-500">Capital</h6>
                  <h3 className="text-2xl font-bold text-red-600">
                    ${report.summary?.total_cost?.toFixed(2) || 0}
                  </h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h6 className="text-sm font-medium text-gray-500">Ganancia</h6>
                  <h3 className="text-2xl font-bold text-green-600">
                    ${report.summary?.total_profit?.toFixed(2) || 0}
                  </h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h6 className="text-sm font-medium text-gray-500">% Ganancia</h6>
                  <h3 className="text-2xl font-bold text-purple-600">
                    {report.summary?.profit_percentage?.toFixed(2) || 0}%
                  </h3>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venta</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ganancia</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Ganancia</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.sales?.map(sale => (
                      <tr key={sale.sale_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(sale.sale_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.client_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                          ${parseFloat(sale.total_amount).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          ${parseFloat(sale.total_cost).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                          ${parseFloat(sale.total_profit).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600">
                          {parseFloat(sale.profit_percentage).toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'inventory':
        return (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h5 className="text-lg font-semibold text-gray-700">Reporte de Inventario</h5>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <h6 className="text-sm font-medium text-gray-500">Total Productos</h6>
                  <h3 className="text-2xl font-bold text-gray-800">{report.statistics?.total_products || 0}</h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <h6 className="text-sm font-medium text-gray-500">Valor de Inventario</h6>
                  <h3 className="text-2xl font-bold text-blue-600">${report.statistics?.total_inventory_value?.toFixed(2) || 0}</h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <h6 className="text-sm font-medium text-gray-500">Productos Bajo Stock</h6>
                  <h3 className="text-2xl font-bold text-yellow-600">{report.statistics?.low_stock_products || 0}</h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <h6 className="text-sm font-medium text-gray-500">Categorías</h6>
                  <h3 className="text-2xl font-bold text-gray-800">{report.statistics?.total_categories || 0}</h3>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P. Compra</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P. Venta</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.products?.map(product => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.stock}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${parseFloat(product.purchase_price).toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${parseFloat(product.sale_price).toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${(product.stock * product.purchase_price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'low-stock':
        return (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h5 className="text-lg font-semibold text-gray-700">Productos con Bajo Stock</h5>
            </div>
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Actual</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Mínimo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.map(product => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category_name}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${product.stock <= product.min_stock ? "text-red-600 font-semibold" : "text-gray-900"}`}>{product.stock}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.min_stock}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {product.stock === 0 ? (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Agotado</span>
                          ) : product.stock <= product.min_stock ? (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Bajo</span>
                          ) : (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Normal</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      default:
        return <div className="bg-blue-50 p-4 rounded-lg text-blue-700">Seleccione un tipo de reporte para ver los resultados</div>;
    }
  };

  return (
    <div className="pb-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Reportes</h1>

      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Reporte</label>
              <select
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="sales">Ventas</option>
                <option value="inventory">Inventario</option>
                <option value="low-stock">Productos con Bajo Stock</option>
              </select>
            </div>

            {reportType === 'sales' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                  <input
                    type="date"
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                  <input
                    type="date"
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                  />
                </div>
              </>
            )}

            <div className="flex items-end">
              <button
                className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                onClick={generateReport}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generando...
                  </span>
                ) : 'Generar Reporte'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">
          <svg className="animate-spin h-10 w-10 mx-auto text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-3 text-gray-600">Generando reporte, por favor espere...</p>
        </div>
      ) : (
        renderReport()
      )}
    </div>
  );
}
