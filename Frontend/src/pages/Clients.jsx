import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Clients() {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [currentClient, setCurrentClient] = useState({
        name: '',
        identificationType: 'cedula',
        identification: '',
        phone: '',
        email: '',
        address: ''
    });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const response = await api.get('/clients');
            setClients(response.data.data || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching clients:', error);
            setError('Error al cargar los clientes');
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.identification && client.identification.includes(searchTerm))
    );

    const openAddClientModal = () => {
        setCurrentClient({
            name: '',
            identificationType: 'cedula',
            identification: '',
            phone: '',
            email: '',
            address: ''
        });
        setShowModal(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentClient(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmitClient = async (e) => {
        e.preventDefault();
        try {
            if (currentClient.id) {
                await api.put(`/clients/${currentClient.id}`, currentClient);
            } else {
                await api.post('/clients', currentClient);
            }
            fetchClients();
            setShowModal(false);
        } catch (error) {
            console.error('Error saving client:', error);
            setError(
                error.response?.data?.message ||
                'Error al guardar el cliente'
            );
        }
    };

    const handleEditClient = (client) => {
        setCurrentClient(client);
        setShowModal(true);
    };

    const handleDeleteClient = async (clientId) => {
        if (window.confirm('¿Estás seguro de eliminar este cliente?')) {
            try {
                await api.delete(`/clients/${clientId}`);
                fetchClients();
            } catch (error) {
                console.error('Error deleting client:', error);
                setError(
                    error.response?.data?.message ||
                    'Error al eliminar el cliente'
                );
            }
        }
    };

    if (loading) return <div>Cargando clientes...</div>;

    return (
        <div className="p-6 bg-gray-100 h-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">👥 Clientes</h1>
                <button
                    onClick={openAddClientModal}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    ➕ Nuevo Cliente
                </button>
            </div>

            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Buscar cliente por nombre o identificación"
                    value={searchTerm}
                    onChange={handleSearch}
                    className="w-full p-2 border rounded-md"
                />
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-200 text-gray-700">
                            <th className="py-3 px-4 text-left">#</th>
                            <th className="py-3 px-4 text-left">Nombre</th>
                            <th className="py-3 px-4 text-left">Tipo ID</th>
                            <th className="py-3 px-4 text-left">Identificación</th>
                            <th className="py-3 px-4 text-left">Teléfono</th>
                            <th className="py-3 px-4 text-left">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredClients.map((client, index) => (
                            <tr key={client.id} className="border-b hover:bg-gray-100">
                                <td className="py-3 px-4">{index + 1}</td>
                                <td className="py-3 px-4">{client.name}</td>
                                <td className="py-3 px-4">
                                    {client.identification_type === 'cedula' ? 'Cédula' : 'RUC'}
                                </td>
                                <td className="py-3 px-4">{client.identification}</td>
                                <td className="py-3 px-4">{client.phone}</td>
                                <td className="py-3 px-4">
                                    <button
                                        onClick={() => handleEditClient(client)}
                                        className="text-blue-500 hover:underline mr-2"
                                    >
                                        ✏️ Editar
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClient(client.id)}
                                        className="text-red-500 hover:underline"
                                    >
                                        🗑️ Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg w-96 p-6">
                        <h2 className="text-2xl mb-4">
                            {currentClient.id ? 'Editar Cliente' : 'Nuevo Cliente'}
                        </h2>
                        <form onSubmit={handleSubmitClient}>
                            <div className="mb-4">
                                <label className="block mb-2">Nombre</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={currentClient.name}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2">Tipo de Identificación</label>
                                <select
                                    name="identificationType"
                                    value={currentClient.identificationType}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="cedula">Cédula</option>
                                    <option value="ruc">RUC</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2">
                                    {currentClient.identificationType === 'cedula'
                                        ? 'Número de Cédula'
                                        : 'Número de RUC'}
                                </label>
                                <input
                                    type="text"
                                    name="identification"
                                    value={currentClient.identification}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                    maxLength={currentClient.identificationType === 'cedula' ? 10 : 13}
                                    pattern={currentClient.identificationType === 'cedula' ? "\\d{10}" : "\\d{13}"}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2">Teléfono</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={currentClient.phone}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={currentClient.email}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2">Dirección</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={currentClient.address}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                            <div className="flex justify-between">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-600 text-white px-4 py-2 rounded"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {error && (
                <div className="mt-4 bg-red-50 p-4 rounded-md">
                    <p className="text-red-700">{error}</p>
                </div>
            )}
        </div>
    );
}
