# Sistema de Liquidaciones - Backend (NestJS)

Este es el servicio de backend para el Sistema de Liquidaciones e Importaciones. Proporciona APIs para gestionar facturas, proveedores, productos y generar reportes detallados en PDF.

## Tecnologías Principales
- **Framework**: NestJS (Node.js)
- **Base de Datos**: MongoDB (Mongoose)
- **IA**: Google Gemini API (Procesamiento de Facturas)
- **Almacenamiento**: Google Cloud Storage (Reportes PDF)
- **Documentación**: Swagger / Scalar

## Instalación y Configuración Local

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Configurar el archivo `.env` basándote en el archivo de ejemplo (asegúrate de incluir las credenciales de MongoDB, Gemini y GCS).
3. Iniciar en modo desarrollo:
   ```bash
   npm run start:dev
   ```

## API Docs

- **Scalar (Recomendado)**: `http://localhost:3000/api-docs`
- **Swagger UI**: `http://localhost:3000/swagger`

---

## Despliegue en GCP

La aplicación está preparada para desplegarse automáticamente en **Google Cloud Platform** mediante **Cloud Run** y **Cloud Build**.

Para ver las instrucciones detalladas de despliegue, consulta el siguiente archivo:

📄 **[Guía de Despliegue en GCP](./GCP_DEPLOY.md)**

---

## Licencia
Nest is [MIT licensed](LICENSE).
