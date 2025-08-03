import { fetchConInterceptor } from '../utils/fetchInterceptor';

const API_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/productos`;
const VERIFICAR_TOKEN_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/verificar-token`;

const ProductosService = {
    // Obtener todos los productos
    all: async () => {
        try {
            const response = await fetchConInterceptor(API_URL);
            if (!response.ok) {
                throw new Error('Error al cargar los productos');
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error al cargar productos:', error);
            return [];
        }
    },

    // Crear o actualizar un producto
    upsert: async (producto) => {
        try {
            const response = await fetchConInterceptor(`${API_URL}/upsert`, {
                method: 'POST',
                body: JSON.stringify(producto),
            });

            if (!response.ok) {
                throw new Error('Error al guardar el producto');
            }

            const data = await response.json();
            return { ok: true, data };
        } catch (error) {
            console.error('Error upsert:', error);
            return { ok: false, error: error.message };
        }
    },

    // Eliminar un producto
    delete: async (id) => {
        try {
            const response = await fetchConInterceptor(`${API_URL}/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Error al eliminar el producto');
            }

            return { ok: true };
        } catch (error) {
            console.error('Error al eliminar:', error);
            return { ok: false, error: error.message };
        }
    },

    // Verificar token
    verificarToken: async (token) => {
        try {
            const response = await fetch(VERIFICAR_TOKEN_URL, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Token inválido');
            }

            return { ok: true, data: await response.json() };
        } catch (error) {
            console.error('Error de verificación de token:', error);
            return { ok: false, error: error.message };
        }
    },

    // Obtener categorías de productos de hardware para computadoras
    fetchCategories: async () => {
        const categoriasHardware = [
            'Procesadores', 'Tarjetas Gráficas', 'Placas Madre', 'Memoria RAM', 
            'Discos Duros', 'SSD', 'Fuentes de Poder', 'Gabinetes', 'Monitores',
            'Teclados', 'Mouse', 'Auriculares', 'Refrigeración', 'Cables y Adaptadores'
        ];

        return categoriasHardware;
    }
};

export default ProductosService;