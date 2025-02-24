export default function Dashboard() {
    return (
        <div className="p-6 bg-gray-100 h-full">
            {/* Título */}
            <h1 className="text-3xl font-bold text-gray-800">📊 Dashboard</h1>

            {/* Bienvenida */}
            <div className="mt-4 bg-white p-4 rounded-lg shadow">
                <p className="text-gray-700 text-lg">Bienvenido al sistema de inventario</p>
            </div>

            {/* Tarjetas con métricas */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow flex flex-col items-center">
                    <h2 className="text-lg font-semibold text-gray-700">Total de Productos</h2>
                    <p className="text-3xl font-bold text-blue-600 mt-2">152</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow flex flex-col items-center">
                    <h2 className="text-lg font-semibold text-gray-700">Stock Bajo</h2>
                    <p className="text-3xl font-bold text-red-600 mt-2">8</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow flex flex-col items-center">
                    <h2 className="text-lg font-semibold text-gray-700">Órdenes Pendientes</h2>
                    <p className="text-3xl font-bold text-yellow-500 mt-2">5</p>
                </div>
            </div>
        </div>
    );
}
