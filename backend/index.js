// Cargar variables de entorno
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
const admin = require('firebase-admin');
const serviceAccount = require(process.env.CREDENTIALS_PATH || './ejercicio-empleados-firebase-adminsdk-fbsvc-7568ba3fd2.json');

const app = express();
const port = process.env.PORT || 3001;

// Ocultar información de versión de Express
app.disable('x-powered-by');

// Middleware
// Configuración segura de CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 horas en segundos
};
app.use(cors(corsOptions));

// Limitar el tamaño de las solicitudes JSON para prevenir ataques DoS
app.use(bodyParser.json({ limit: '1mb' }));

// Configurar encabezados de seguridad
app.use((req, res, next) => {
  // Prevenir que el navegador MIME-sniffing una respuesta de su tipo de contenido declarado
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Habilitar la protección XSS en navegadores antiguos
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Evitar que la página se cargue en un iframe
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

// Configuración de Firebase
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyB8iCyrHKQigMQmMvHoC3s-kD8pf-c7Oc0",
    authDomain: process.env.DATABASE_URL || "ejercicio-empleados.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "ejercicio-empleados",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "ejercicio-empleados.appspot.com",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "82608844864",
    appId: process.env.FIREBASE_APP_ID || "1:82608844864:web:bc586309faeb8b56606fa5"
};

// Inicializar Firebase
const firebaseApp = initializeApp(firebaseConfig);
global.db = getFirestore(firebaseApp);

// Inicializar Firebase Admin y hacerlo global
try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    // Hacer admin accesible globalmente
    global.admin = admin;
} catch (error) {
    console.error('Error al inicializar Firebase Admin:', error);
}

// Importar controladores
const EmpleadosCtrl = require('./controllers/empleados.ctrl');
const ProductosCtrl = require('./controllers/productos.ctrl');
const MiddlewareCtrl = require('./controllers/middleware.ctrl');

// Definir rutas
// Rutas para empleados
app.get('/empleados', MiddlewareCtrl.verificarToken, EmpleadosCtrl.all);
app.post('/empleados/upsert', MiddlewareCtrl.verificarToken, EmpleadosCtrl.upsert);
app.delete('/empleados/:id', MiddlewareCtrl.verificarToken, EmpleadosCtrl.delete);

// Rutas para productos
app.get('/productos', MiddlewareCtrl.verificarToken, ProductosCtrl.all);
app.post('/productos/upsert', MiddlewareCtrl.verificarToken, ProductosCtrl.upsert);
app.delete('/productos/:id', MiddlewareCtrl.verificarToken, ProductosCtrl.delete);

// Endpoint para verificar la validez del token
app.get('/verificar-token', MiddlewareCtrl.verificarToken, (req, res) => {
    // Si llegamos aquí, el token es válido (el middleware verificarToken ya lo comprobó)
    res.status(200).json({ valido: true, usuario: req.usuario });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor backend ejecutándose en http://localhost:${port}`);
});