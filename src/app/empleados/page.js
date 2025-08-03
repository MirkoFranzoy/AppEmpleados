'use client';

import { useState, useEffect } from 'react';
import styles from '../page.module.css';
import { auth } from '../firebase';
import { useRouter } from 'next/navigation';
import { limpiarSesion } from '../utils/fetchInterceptor';
import EmpleadosService from './empleados.services';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  // Estados
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [empleados, setEmpleados] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [empleadoEditando, setEmpleadoEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    rol: '',
    dni: '',
    antiguedad: '',
    pais: ''
  });
  const [paises, setPaises] = useState([]);

  // Constantes

  const abrirModal = (empleado = null) => {
    if (empleado) {
      setEmpleadoEditando(empleado);
      setFormData(empleado);
    } else {
      setEmpleadoEditando(null);
      setFormData({
        nombre: '',
        email: '',
        rol: '',
        dni: '',
        antiguedad: '',
        pais: '',
        owner: user?.email || ''
      });
    }
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEmpleadoEditando(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'dni') {
      const numerosFiltrados = value.replace(/\D/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: numerosFiltrados
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  // Función handleSubmit para usar EmpleadosService
  const handleSubmit = async (e) => {
    e.preventDefault();
    const empleadoData = { ...formData };
    
    // Si estamos editando, incluimos el ID
    if (empleadoEditando) {
      empleadoData.id = empleadoEditando.id;
    }

    try {
      const result = await EmpleadosService.upsert(empleadoData);

      if (!result.ok) {
        throw new Error(result?.error || 'Error en la respuesta del servidor');
      }

      if (empleadoEditando) {
        setEmpleados(prev => prev.map(emp =>
          emp.id === empleadoEditando.id ? result.data : emp
        ));
      } else {
        setEmpleados(prev => [...prev, result.data]);
      }
      cerrarModal();
    } catch (error) {
      console.error('Error:', error);
      alert('Hubo un error. Por favor, inténtelo de nuevo.');
    }
  };

  // Función eliminarEmpleado para usar EmpleadosService
  const eliminarEmpleado = async (id) => {
    if (confirm('¿Estás seguro de que deseas eliminar este empleado?')) {
      try {
        const result = await EmpleadosService.delete(id);

        if (!result.ok) {
          throw new Error(result?.error || 'Error en la respuesta del servidor');
        }

        setEmpleados(prev => prev.filter(emp => emp.id !== id));
      } catch (error) {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar el empleado');
      }
    }
  };

  // Modificar el useEffect para cargar empleados desde el API usando EmpleadosService
  useEffect(() => {
    const cargarEmpleados = async () => {
      try {
        const empleadosData = await EmpleadosService.all();
        setEmpleados(empleadosData);
      } catch (error) {
        console.error('Error al cargar empleados:', error);
      }
      setLoading(false);
    };

    if (user) {
      cargarEmpleados();
    }
  }, [user]);

  useEffect(() => {
    const cargarPaises = async () => {
      const nombresPaises = await EmpleadosService.fetchCountries();
      setPaises(nombresPaises);
    };
    
    cargarPaises();
  }, []);

  // Modificar el useEffect para la autenticación
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        // Limpiar la sesión y redirigir al login
        limpiarSesion();
        router.push('/login');
        setLoading(false);
        setUser(null);
      } else {
        // Verificar que el token almacenado es válido haciendo una petición al backend
        const storedToken = localStorage.getItem('authToken');
        
        // Si hay un token almacenado, verificar su validez con el backend
        if (storedToken) {
          // Usar el servicio para verificar el token
          EmpleadosService.verificarToken(storedToken)
            .then(result => {
              if (!result.ok) {
                throw new Error(result?.error || 'Token inválido');
              }
              
              // Token válido, actualizar información del usuario
              setUser(user);
              localStorage.setItem('user', JSON.stringify({
                email: user?.email,
                uid: user?.uid
              }));
            })
            .catch(error => {
              console.error('Error de verificación de token:', error);
              // Token inválido o error en la verificación, cerrar sesión
              auth.signOut();
              limpiarSesion();
              router.push('/login');
            })
            .finally(() => {
              setLoading(false);
            });
        } else {
          // No hay token almacenado, obtener uno nuevo
          user.getIdToken().then(idToken => {
            localStorage.setItem('authToken', idToken);
            localStorage.setItem('user', JSON.stringify({
              email: user?.email,
              uid: user?.uid
            }));
            setUser(user);
            setLoading(false);
          });
        }
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Modificar el renderizado condicional
  if (loading) return <div>Cargando...</div>;

  if (!user) {
      return <div>Redirigiendo al login...</div>;
  }

  return (
      <div className={styles.container}>
          <div className={styles.header}>
              <h1>Lista de Empleados</h1>
              <div>
                  <span className={styles.userEmail}>Bienvenido, {user?.email}</span>
                  <button 
                      className={styles.logoutButton}
                      onClick={() => auth.signOut()}
                  >
                      Cerrar sesión
                  </button>
              </div>
          </div>
          <div className={styles.navigationButtons}>
              <Link href="/empleados" className={styles.navButtonActive}>
                  Ver Empleados
              </Link>
              <Link href="/productos" className={styles.navButton}>
                  Ver Productos
              </Link>
          </div>
          <button 
              className={styles.addButton}
              onClick={() => abrirModal()}
          >
              Agregar Empleado
          </button>
          
          {/* Tabla de empleados */}
          <div className={styles.tableContainer}>
              <table className={styles.table}>
                  <thead>
                      <tr>
                          <th>Nombre</th>
                          <th>Email</th>
                          <th>Rol</th>
                          <th>DNI</th>
                          <th>Antigüedad</th>
                          <th>País</th>
                          <th>Acciones</th>
                      </tr>
                  </thead>
                  <tbody>
                      {empleados.map(empleado => (
                          <tr key={empleado.id}>
                              <td>{empleado.nombre}</td>
                              <td>{empleado.email}</td>
                              <td>{empleado.rol}</td>
                              <td>{empleado.dni}</td>
                              <td>{empleado.antiguedad} años</td>
                              <td>{empleado.pais}</td>
                              <td>
                                  <button 
                                      className={styles.editButton}
                                      onClick={() => abrirModal(empleado)}
                                  >
                                      Editar
                                  </button>
                                  <button 
                                      className={styles.deleteButton}
                                      onClick={() => eliminarEmpleado(empleado.id)}
                                  >
                                      Eliminar
                                  </button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
          
          {modalAbierto && (
            <div className={styles.modal}>
              <div className={styles.modalContent}>
                <h2>{empleadoEditando ? 'Editar Empleado' : 'Agregar Empleado'}</h2>
                <form onSubmit={handleSubmit}>
                  <div className={styles.formGroup}>
                    <label htmlFor="nombre">Nombre:</label>
                    <input
                      type="text"
                      id="nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="email">Email:</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="rol">Rol:</label>
                    <select
                      id="rol"
                      name="rol"
                      value={formData.rol}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Seleccione un rol</option>
                      <option value="Jefe">Jefe</option>
                      <option value="Operador">Operador</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="dni">DNI:</label>
                    <input
                      type="text"
                      id="dni"
                      name="dni"
                      value={formData.dni}
                      onChange={handleInputChange}
                      pattern="[0-9]*"
                      title="Por favor ingrese solo números"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="antiguedad">Antigüedad (años):</label>
                    <input
                      type="number"
                      id="antiguedad"
                      name="antiguedad"
                      value={formData.antiguedad}
                      onChange={handleInputChange}
                      min="0"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="pais">País:</label>
                    <select
                      id="pais"
                      name="pais"
                      value={formData.pais}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Seleccione un país</option>
                      {paises.map(pais => (
                        <option key={pais} value={pais}>{pais}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.modalButtons}>
                    <button type="submit" className={styles.saveButton}>
                      {empleadoEditando ? 'Guardar Cambios' : 'Agregar'}
                    </button>
                    <button
                      type="button"
                      className={styles.cancelButton}
                      onClick={cerrarModal}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      );
}