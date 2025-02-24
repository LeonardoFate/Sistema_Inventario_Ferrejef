import { useEffect, useState } from "react";

function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token"); // Obtiene el token guardado

        fetch("http://localhost:3000/api/products", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` // Agrega el token
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
    }, []);


    return (
        <div className="p-6 bg-gray-100 h-full">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">📦 Productos</h1>
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
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
                                        <td className={`py-3 px-4 font-bold ${
                                            product.low_stock ? "text-red-600" : "text-green-600"
                                        }`}>
                                            {product.stock}
                                        </td>
                                        <td className="py-3 px-4">
                                            <button className="text-blue-500 hover:underline">✏️ Editar</button>
                                            <button className="text-red-500 hover:underline ml-4">🗑️ Eliminar</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="py-3 px-4 text-center text-gray-600">
                                        No hay productos disponibles
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default Products;
