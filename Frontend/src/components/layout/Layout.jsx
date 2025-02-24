import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../assets/logo_1.jpg';

export default function Layout() {
    const { user, logout } = useAuth();
    const location = useLocation();

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-lg flex flex-col p-5">
                <div className="text-center mb-6">
                    <div className="flex justify-center">
                        <img src={Logo} alt="Logo" className="w-32" />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">FERREJEFF</p>
                </div>

                <nav className="flex flex-col space-y-2">
                    <Link
                        to="/"
                        className={`px-4 py-2 rounded hover:bg-gray-200 ${location.pathname === '/' ? 'bg-gray-300 font-semibold' : ''
                            }`}
                    >
                        📊 Dashboard
                    </Link>
                    <Link
                        to="/products"
                        className={`px-4 py-2 rounded hover:bg-gray-200 ${location.pathname === '/products' ? 'bg-gray-300 font-semibold' : ''
                            }`}
                    >
                        📦 Productos
                    </Link>
                    <Link
                        to="/categories"
                        className={`px-4 py-2 rounded hover:bg-gray-200 ${location.pathname === '/categories' ? 'bg-gray-300 font-semibold' : ''
                            }`}
                    >
                        🏷️ Categorías
                    </Link>
                    <Link
                        to="/sales"
                        className={`px-4 py-2 rounded hover:bg-gray-200 ${location.pathname === '/sales' ? 'bg-gray-300 font-semibold' : ''
                            }`}
                    >
                        💰 Ventas
                    </Link>
                    <Link
                        to="/sales/new"
                        className={`px-4 py-2 rounded hover:bg-gray-200 ${location.pathname === '/sales/new' ? 'bg-gray-300 font-semibold' : ''
                            }`}
                    >
                        💰 Nueva Venta
                    </Link>
                    <Link
                        to="/clients"
                        className={`px-4 py-2 rounded hover:bg-gray-200 ${location.pathname === '/clients' ? 'bg-gray-300 font-semibold' : ''
                            }`}
                    >
                        👥 Clientes
                    </Link>
                    <Link
                        to="/reports"
                        className={`px-4 py-2 rounded hover:bg-gray-200 ${location.pathname === '/reports' ? 'bg-gray-300 font-semibold' : ''
                            }`}
                    >
                        📈 Reportes
                    </Link>
                </nav>

                <div className="mt-auto pt-4 border-t">
                    <button
                        onClick={logout}
                        className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col">
                {/* Navbar */}
                <header className="bg-white shadow-md p-4 flex justify-between items-center">
                    <h1 className="text-xl font-semibold">Sistema de Inventario</h1>
                    <span className="text-gray-700">{user?.full_name}</span>
                </header>

                {/* Page Content */}
                <main className="p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
