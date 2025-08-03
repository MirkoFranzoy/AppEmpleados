// Función para limpiar la sesión
export const limpiarSesion = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};

// Función para obtener el token de autenticación
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Interceptor de fetch para manejar errores de autenticación
export const fetchConInterceptor = async (url, options = {}) => {
  // Obtener el token de autenticación
  const token = getAuthToken();
  
  // Configurar los headers con el token si existe
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Realizar la petición
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  // Manejar errores de autenticación (401 o 403)
  if (response.status === 401 || response.status === 403) {
    // Limpiar la sesión
    limpiarSesion();
    
    // Redirigir al login usando window.location en lugar de useRouter
    window.location.href = '/login';
    
    // Lanzar un error para que el código que llama sepa que hubo un problema
    throw new Error('Sesión expirada o no autorizada');
  }
  
  return response;
};