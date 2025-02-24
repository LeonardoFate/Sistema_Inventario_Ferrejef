export default function Categories() {
    return (
        <div className="p-6 bg-gray-100 h-full">
            {/* Título y botón */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">🏷️ Categorías</h1>
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    ➕ Agregar Categoría
                </button>
            </div>

            {/* Tabla de categorías */}
            <div className="mt-6 bg-white p-6 rounded-lg shadow">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-200 text-gray-700">
                            <th className="py-3 px-4 text-left">#</th>
                            <th className="py-3 px-4 text-left">Nombre</th>
                            <th className="py-3 px-4 text-left">Descripción</th>
                            <th className="py-3 px-4 text-left">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b hover:bg-gray-100">
                            <td className="py-3 px-4">1</td>
                            <td className="py-3 px-4">Electrónica</td>
                            <td className="py-3 px-4">Dispositivos y accesorios electrónicos</td>
                            <td className="py-3 px-4">
                                <button className="text-blue-500 hover:underline">✏️ Editar</button>
                                <button className="text-red-500 hover:underline ml-4">🗑️ Eliminar</button>
                            </td>
                        </tr>
                        <tr className="border-b hover:bg-gray-100">
                            <td className="py-3 px-4">2</td>
                            <td className="py-3 px-4">Hogar</td>
                            <td className="py-3 px-4">Muebles y decoración para el hogar</td>
                            <td className="py-3 px-4">
                                <button className="text-blue-500 hover:underline">✏️ Editar</button>
                                <button className="text-red-500 hover:underline ml-4">🗑️ Eliminar</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
