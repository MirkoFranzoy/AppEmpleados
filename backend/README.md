# Backend de React Empleados

## Configuración de Variables de Entorno

Este backend utiliza variables de entorno para manejar información confidencial. Sigue estos pasos para configurar correctamente el entorno:

1. Crea un archivo `.env` en la raíz de la carpeta `backend` con las siguientes variables:

```
PORT=3001
DATABASE_URL=tu_database_url
CREDENTIALS_PATH=./ruta_a_tu_archivo_de_credenciales.json
FIREBASE_API_KEY=tu_api_key
FIREBASE_PROJECT_ID=tu_project_id
FIREBASE_STORAGE_BUCKET=tu_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
FIREBASE_APP_ID=tu_app_id
```

## Ejecución del Backend

```bash
npm install
npm start
```

El backend estará disponible en `http://localhost:3001`.