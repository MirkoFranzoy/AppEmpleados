'use client';

import { useState, useEffect } from 'react';
import styles from '../page.module.css';
import { auth } from '../firebase';
import { useRouter } from 'next/navigation';
import { limpiarSesion } from '../utils/fetchInterceptor';
import ProductosService from './productos.services';
import Link from 'next/link';

export default function Productos() {
  const router = useRouter();
  // Estados
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [productos, setProductos] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    precio: '',
    moneda: ''
  });
  const [categorias, setCategorias] = useState([]);

  // Constantes
  const monedasDisponibles = ['USD', 'EUR', 'ARS', 'MXN', 'COP', 'PEN', 'CLP', 'UYU', 'BRL'];

  const abrirModal = (producto = null) => {
    if (producto) {
      setProductoEditando(producto);
      setFormData(producto);
    } else {
      setProductoEditando(null);
      setFormData({
        nombre: '',
        categoria: '',
        precio: '',
        moneda: '',
        owner: user?.email || ''
      });
    }
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setProductoEditando(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'precio') {
      // Permitir solo números y punto decimal
      const precioFiltrado = value.replace(/[^\d.]/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: precioFiltrado
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const productoData = { ...formData };
    
    // Si estamos editando, incluimos el ID
    if (productoEditando) {
      productoData.id = productoEditando.id;
    }

    try {
      const result = await ProductosService.upsert(productoData);

      if (!result.ok) {
        throw new Error(result.error || 'Error en la respuesta del servidor');
      }

      if (productoEditando) {
        setProductos(prev => prev.map(prod =>
          prod.id === productoEditando.id ? result.data : prod
        ));
      } else {
        setProductos(prev => [...prev, result.data]);
      }
      cerrarModal();
    } catch (error) {
      console.error('Error:', error);
      alert('Hubo un error. Por favor, inténtelo de nuevo.');
    }
  };

  const eliminarProducto = async (id) => {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      try {
        const result = await ProductosService.delete(id);

        if (!result.ok) {
          throw new Error(result.error || 'Error en la respuesta del servidor');
        }

        setProductos(prev => prev.filter(prod => prod.id !== id));
      } catch (error) {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar el producto');
      }
    }
  };

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const productosData = await ProductosService.all();
        setProductos(productosData);
      } catch (error) {
        console.error('Error al cargar productos:', error);
      }
      setLoading(false);
    };

    if (user) {
      cargarProductos();
    }
  }, [user]);

  useEffect(() => {
    const cargarCategorias = async () => {
      const categoriasList = await ProductosService.fetchCategories();
      setCategorias(categoriasList);
    };
    
    cargarCategorias();
  }, []);

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
          ProductosService.verificarToken(storedToken)
            .then(result => {
              if (!result.ok) {
                throw new Error(result.error || 'Token inválido');
              }
              
              // Token válido, actualizar información del usuario
              setUser(user);
              localStorage.setItem('user', JSON.stringify({
                email: user.email,
                uid: user.uid
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
              email: user.email,
              uid: user.uid
            }));
            setUser(user);
            setLoading(false);
          });
        }
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) return <div>Cargando...</div>;

  if (!user) {
      return <div>Redirigiendo al login...</div>;
  }

  return (
      <div className={styles.container}>
          <div className={styles.header}>
              <h1>Lista de Productos</h1>
              <div>
                  <span className={styles.userEmail}>Bienvenido, {user.email}</span>
                  <button 
                      className={styles.logoutButton}
                      onClick={() => auth.signOut()}
                  >
                      Cerrar sesión
                  </button>
              </div>
          </div>
          <div className={styles.navigationButtons}>
              <Link href="/empleados" className={styles.navButton}>
                  Ver Empleados
              </Link>
              <Link href="/productos" className={styles.navButtonActive}>
                  Ver Productos
              </Link>
          </div>
          <button 
              className={styles.addButton}
              onClick={() => abrirModal()}
          >
              Agregar Producto
          </button>
          
          {/* Tabla de productos */}
          <div className={styles.tableContainer}>
              <table className={styles.table}>
                  <thead>
                      <tr>
                          <th>Nombre</th>
                          <th>Categoría</th>
                          <th>Precio</th>
                          <th>Moneda</th>
                          <th>Acciones</th>
                      </tr>
                  </thead>
                  <tbody>
                      {productos.map(producto => (
                          <tr key={producto.id}>
                              <td>{producto.nombre}</td>
                              <td>{producto.categoria}</td>
                              <td>{producto.precio}</td>
                              <td>{producto.moneda}</td>
                              <td>
                                  <button 
                                      className={styles.editButton}
                                      onClick={() => abrirModal(producto)}
                                  >
                                      Editar
                                  </button>
                                  <button 
                                      className={styles.deleteButton}
                                      onClick={() => eliminarProducto(producto.id)}
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
                <h2>{productoEditando ? 'Editar Producto' : 'Agregar Producto'}</h2>
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
                    <label htmlFor="categoria">Categoría:</label>
                    <select
                      id="categoria"
                      name="categoria"
                      value={formData.categoria}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Seleccione una categoría</option>
                      {categorias.map(categoria => (
                        <option key={categoria} value={categoria}>{categoria}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="precio">Precio:</label>
                    <input
                      type="text"
                      id="precio"
                      name="precio"
                      value={formData.precio}
                      onChange={handleInputChange}
                      pattern="[0-9]+(\.[0-9]+)?"
                      title="Por favor ingrese un número válido"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="moneda">Moneda:</label>
                    <select
                      id="moneda"
                      name="moneda"
                      value={formData.moneda}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Seleccione una moneda</option>
                      {monedasDisponibles.map(moneda => (
                        <option key={moneda} value={moneda}>{moneda}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.modalButtons}>
                    <button type="submit" className={styles.saveButton}>
                      {productoEditando ? 'Guardar Cambios' : 'Agregar'}
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