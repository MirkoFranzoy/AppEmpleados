import { fetchConInterceptor } from '../utils/fetchInterceptor';

const API_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/empleados`;
const VERIFICAR_TOKEN_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/verificar-token`;

const EmpleadosService = {
    // Obtener todos los empleados
    all: async () => {
        try {
            const response = await fetchConInterceptor(API_URL);
            if (!response.ok) {
                throw new Error('Error al cargar los empleados');
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error al cargar empleados:', error);
            return [];
        }
    },

    // Crear o actualizar un empleado
    upsert: async (empleado) => {
        try {
            const response = await fetchConInterceptor(`${API_URL}/upsert`, {
                method: 'POST',
                body: JSON.stringify(empleado),
            });

            if (!response.ok) {
                throw new Error('Error al guardar el empleado');
            }

            const data = await response.json();
            return { ok: true, data };
        } catch (error) {
            console.error('Error upsert:', error);
            return { ok: false, error: error?.message };
        }
    },

    // Eliminar un empleado
    delete: async (id) => {
        try {
            const response = await fetchConInterceptor(`${API_URL}/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Error al eliminar el empleado');
            }

            return { ok: true };
        } catch (error) {
            console.error('Error al eliminar:', error);
            return { ok: false, error: error?.message };
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
            return { ok: false, error: error?.message };
        }
    },

    // Obtener países
    fetchCountries: async () => {
        const paisesPorDefecto = [
            'Argentina', 'Brasil', 'Chile', 'Colombia',
            'España', 'México', 'Perú', 'Uruguay', 'Venezuela'
        ];

        try {
            const response = await fetch('https://restcountries.com/v3.1/all');
            if (!response.ok) {
                throw new Error('Error al cargar los países');
            }
            const data = await response.json();
            return data
                .map(pais => pais?.name?.common)
                .filter(Boolean)
                .sort();
        } catch (error) {
            console.error('Error al cargar países:', error);
            return paisesPorDefecto;
        }
    }
};

export default EmpleadosService;