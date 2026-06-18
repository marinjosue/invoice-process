# Despliegue en Google Cloud Platform (GCP)

Este documento describe los pasos necesarios para desplegar la aplicación de backend en Google Cloud Platform utilizando **Cloud Build** y **Cloud Run**.

## Arquitectura de Despliegue
- **Cloud Build**: Se encarga de construir la imagen de Docker y subirla a Container Registry.
- **Cloud Run**: Ejecuta el contenedor de la aplicación.
- **Container Registry**: Almacena las imágenes de Docker.
- **Google Cloud Storage**: Se utiliza para almacenar los reportes PDF generados.

## Requisitos Previos
1. Tener una cuenta de Google Cloud y un proyecto creado.
2. Tener instalado el [Google Cloud CLI](https://cloud.google.com/sdk/docs/install).
3. Habilitar las siguientes APIs en el proyecto:
   - Cloud Build API
   - Cloud Run API
   - Container Registry API
   - Secret Manager (opcional, para mayor seguridad)

## Configuración del Entorno en GCP
Para que la aplicación funcione correctamente en Cloud Run, debes configurar las variables de entorno. Puedes hacerlo directamente en la consola de Cloud Run o mediante comandos de `gcloud`.

### Variables de Entorno Necesarias
| Variable | Descripción |
| --- | --- |
| `MONGO` | URL de conexión a MongoDB Atlas. |
| `JWT_SECRET` | Secreto para firmar los tokens JWT. |
| `FRONTEND_URL` | URL de la aplicación frontend para habilitar CORS. |
| `EMAIL_USER` | Usuario de Gmail para enviar correos. |
| `EMAIL_PASSWORD` | Contraseña de aplicación de Gmail. |
| `GEMINI_API_KEY` | API Key de Google Gemini para procesamiento de facturas. |
| `GCS_BUCKET` | Nombre del bucket de Cloud Storage para reportes. |

> [!IMPORTANT]
> **No necesitas** configurar `GCP_SA_KEY` en Cloud Run, ya que la aplicación detectará automáticamente las credenciales de la cuenta de servicio predeterminada de Cloud Run si tiene los permisos adecuados.

## Despliegue Directo con Cloud Build
Desde la raíz del proyecto, ejecuta el siguiente comando para iniciar el proceso de construcción y despliegue definido en `cloudbuild.yaml`:

```bash
gcloud builds submit --config cloudbuild.yaml .
```

Este comando:
1. Sube el código a Cloud Build.
2. Construye la imagen de Docker basada en el `Dockerfile`.
3. Sube la imagen a `gcr.io/[PROJECT_ID]/invoice-process-backend`.
4. Despliega la nueva versión en Cloud Run con el nombre `invoice-process-backend`.

## Permisos de Cuenta de Servicio
Asegúrate de que la cuenta de servicio que usa Cloud Run (usualmente `[PROJECT_NUMBER]-compute@developer.gserviceaccount.com`) tenga el rol de **Administrador de Objetos de Storage** (`roles/storage.objectAdmin`) en el bucket definido en `GCS_BUCKET`.

Esto es necesario para que la aplicación pueda subir los reportes PDF generados.

## Verificación
Una vez terminado el despliegue, Cloud Run te proporcionará una URL pública (ejemplo: `https://invoice-process-backend-xxxxx-uc.a.run.app`).

Puedes verificar que la API está activa accediendo a:
- Docs de Scalar: `https://[URL-CLOUDRUN]/api-docs`
- Swagger UI: `https://[URL-CLOUDRUN]/swagger`
