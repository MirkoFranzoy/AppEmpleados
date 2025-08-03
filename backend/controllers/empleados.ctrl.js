const { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, getDoc } = require('firebase/firestore');

const EmpleadosCtrl = {
    all: async (req, res) => {
        try {
            const db = global.db || req.app.locals.db;
            const empleadosCol = collection(db, 'empleados');
            const empleadosSnapshot = await getDocs(empleadosCol);
            
            const empleadosList = empleadosSnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .filter(empleado => empleado.owner === req.usuario?.email);
                
            res.status(200).json(empleadosList);
        } catch (error) {
            console.error('Error al obtener empleados:', error);
            res.status(500).json({ error: 'Error al obtener empleados' });
        }
    },
    
    upsert: async (req, res) => {
        try {
            const db = global.db || req.app.locals.db;
            const empleadoData = req.body;
            
            // Validar campos requeridos
            const camposRequeridos = ['nombre', 'email', 'rol', 'dni', 'antiguedad', 'pais'];
            for (const campo of camposRequeridos) {
                if (!empleadoData[campo]) {
                    return res.status(400).json({ error: `El campo ${campo} es requerido` });
                }
            }
            
            // Si tiene ID, actualiza; si no, crea uno nuevo
            let docRef;
            if (empleadoData.id) {
                // Verificar si el documento existe
                const docSnap = await getDoc(doc(db, 'empleados', empleadoData.id));
                if (!docSnap.exists()) {
                    return res.status(404).json({ error: 'Empleado no encontrado' });
                }
                
                // Verificar que el usuario que actualiza es el propietario
                const empleadoActual = docSnap.data();
                if (empleadoActual.owner !== req.usuario?.email) {
                    return res.status(403).json({ 
                        error: 'No tienes permiso para actualizar este empleado',
                        message: 'Solo el propietario puede actualizar sus empleados'
                    });
                }
                
                // Eliminar propiedades que no deben ser modificadas
                if(empleadoData.hasOwnProperty('owner')){
                    delete empleadoData.owner;
                }
                
                // Actualizar documento existente
                docRef = doc(db, 'empleados', empleadoData.id);
                const { id, ...dataWithoutId } = empleadoData; // Eliminar el id del objeto de datos
                await setDoc(docRef, dataWithoutId);
                res.status(200).json({ id: empleadoData.id, ...dataWithoutId });
            } else {
                // Agregar el email del usuario autenticado como propietario
                empleadoData.owner = req.usuario?.email;
                
                // Crear nuevo documento con ID generado por Firestore
                docRef = doc(collection(db, 'empleados'));
                await setDoc(docRef, empleadoData);
                res.status(201).json({ id: docRef.id, ...empleadoData });
            }
        } catch (error) {
            console.error('Error al crear/actualizar empleado:', error);
            res.status(500).json({ error: 'Error al crear/actualizar empleado' });
        }
    },
    
    delete: async (req, res) => {
        try {
            const db = global.db || req.app.locals.db;
            const id = req.params.id;
            
            // Verificar si el documento existe
            const docRef = doc(db, 'empleados', id);
            const docSnap = await getDoc(docRef);
            
            if (!docSnap.exists()) {
                return res.status(404).json({ error: 'Empleado no encontrado' });
            }
            
            // Verificar que el usuario que elimina es el propietario
            const empleadoData = docSnap.data();
            if (empleadoData.owner !== req.usuario?.email) {
                return res.status(403).json({ 
                    error: 'No tienes permiso para eliminar este empleado',
                    message: 'Solo el propietario puede eliminar sus empleados'
                });
            }
            
            // Eliminar el documento
            await deleteDoc(docRef);
            res.status(200).json({ message: 'Empleado eliminado correctamente' });
        } catch (error) {
            console.error('Error al eliminar empleado:', error);
            res.status(500).json({ error: 'Error al eliminar empleado' });
        }
    }
};

module.exports = EmpleadosCtrl;