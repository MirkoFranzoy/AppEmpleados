// Ya no necesitamos importar admin porque está disponible globalmente

const MiddlewareCtrl = {
    verificarToken: async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'No se proporcionó token de autenticación' });
            }
            
            const idToken = authHeader.split('Bearer ')[1];
            
            try {
                // Verificar el token con Firebase Admin
                const decodedToken = await admin.auth().verifyIdToken(idToken);
                req.usuario = decodedToken; // Guardar la información del usuario en el request para uso posterior
                next(); // Usuario válido, continuar con el flujo normal
            } catch (error) {
                console.error('Error al verificar token:', error);
                return res.status(403).json({ error: 'Token inválido o expirado' });
            }
        } catch (error) {
            console.error('Error en middleware de autenticación:', error);
            return res.status(500).json({ error: 'Error en la autenticación' });
        }
    }
};

module.exports = MiddlewareCtrl;