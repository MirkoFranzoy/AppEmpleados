const { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, getDoc } = require('firebase/firestore');

const ProductosCtrl = {
    all: async (req, res) => {
        try {
            const db = global.db || req.app.locals.db;
            const productosCol = collection(db, 'productos');
            const productosSnapshot = await getDocs(productosCol);
            
            const productosList = productosSnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .filter(producto => producto.owner === req.usuario?.email);
                
            res.status(200).json(productosList);
        } catch (error) {
            console.error('Error al obtener productos:', error);
            res.status(500).json({ error: 'Error al obtener productos' });
        }
    },
    
    upsert: async (req, res) => {
        try {
            const db = global.db || req.app.locals.db;
            const productoData = req.body;
            
            // Validar campos requeridos
            const camposRequeridos = ['nombre', 'categoria', 'precio', 'moneda'];
            for (const campo of camposRequeridos) {
                if (!productoData[campo]) {
                    return res.status(400).json({ error: `El campo ${campo} es requerido` });
                }
            }
            
            // Validar que precio sea un número
            if (isNaN(parseFloat(productoData.precio))) {
                return res.status(400).json({ error: 'El precio debe ser un número válido' });
            }
            
            // Convertir precio a número
            productoData.precio = parseFloat(productoData.precio);
            
            // Si tiene ID, actualiza; si no, crea uno nuevo
            let docRef;
            if (productoData.id) {
                // Verificar si el documento existe
                const docSnap = await getDoc(doc(db, 'productos', productoData.id));
                if (!docSnap.exists()) {
                    return res.status(404).json({ error: 'Producto no encontrado' });
                }
                
                // Verificar que el usuario que actualiza es el propietario
                const productoActual = docSnap.data();
                if (productoActual.owner !== req.usuario?.email) {
                    return res.status(403).json({ 
                        error: 'No tienes permiso para actualizar este producto',
                        message: 'Solo el propietario puede actualizar sus productos'
                    });
                }
                
                // Eliminar propiedades que no deben ser modificadas
                if(productoData.hasOwnProperty('owner')){
                    delete productoData.owner;
                }
                
                // Actualizar documento existente
                docRef = doc(db, 'productos', productoData.id);
                const { id, ...dataWithoutId } = productoData; // Eliminar el id del objeto de datos
                await setDoc(docRef, dataWithoutId);
                res.status(200).json({ id: productoData.id, ...dataWithoutId });
            } else {
                // Agregar el email del usuario autenticado como propietario
                productoData.owner = req.usuario?.email;
                
                // Crear nuevo documento con ID generado por Firestore
                docRef = doc(collection(db, 'productos'));
                await setDoc(docRef, productoData);
                res.status(201).json({ id: docRef.id, ...productoData });
            }
        } catch (error) {
            console.error('Error al crear/actualizar producto:', error);
            res.status(500).json({ error: 'Error al crear/actualizar producto' });
        }
    },
    
    delete: async (req, res) => {
        try {
            const db = global.db || req.app.locals.db;
            const id = req.params.id;
            
            // Verificar si el documento existe
            const docRef = doc(db, 'productos', id);
            const docSnap = await getDoc(docRef);
            
            if (!docSnap.exists()) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }
            
            // Verificar que el usuario que elimina es el propietario
            const productoData = docSnap.data();
            if (productoData.owner !== req.usuario?.email) {
                return res.status(403).json({ 
                    error: 'No tienes permiso para eliminar este producto',
                    message: 'Solo el propietario puede eliminar sus productos'
                });
            }
            
            // Eliminar el documento
            await deleteDoc(docRef);
            res.status(200).json({ message: 'Producto eliminado correctamente' });
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            res.status(500).json({ error: 'Error al eliminar producto' });
        }
    }
};

module.exports = ProductosCtrl;