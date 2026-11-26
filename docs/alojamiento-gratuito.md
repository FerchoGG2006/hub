# Retomar Platorin sin cuota mensual

Decisión del 26 de noviembre de 2026: entorno para retomar y probar, aceptando suspensión y límites. No se contrataron planes ni se pagaron facturas de Render.

| Parte | Destino previsto | Configuración |
| --- | --- | --- |
| Frontend React | Cloudflare Pages Free | `npm run build`, salida `dist`, Node 24, `VITE_BASE_PATH=/` |
| API FastAPI | Railway Free | Dockerfile de la raíz, un servicio y un proceso, suspensión habilitada |
| PostgreSQL | Neon Free existente | Rama de recuperación, conexión sin pool persistente |
| Tiempo real | Memoria del proceso de API | Sin servicio Redis adicional; una sola réplica |

Railway Free aporta $1 de recursos al mes; al agotarse, los servicios se detienen hasta el próximo ciclo. Una cuenta nueva puede comenzar con una prueba de 30 días/$5: elegir Free después, sin contratar Hobby. No equivale a servicio continuo para clientes. Los WebSockets abiertos y el tráfico de base de datos pueden retrasar la suspensión. No añadir monitores que mantengan despierto el servicio.

## Recuperación verificada

Proyecto Neon `hub` (`fragrant-frog-85392057`), rama original `production` conservada. Se creó `platorin-recovery-2026-11-26` (`br-snowy-rain-aml8qzwb`) y se adaptó únicamente esa copia.

- 20 negocios, 74 productos, 132 pedidos y 21 usuarios conservados.
- Las huellas SHA-256 y cantidades de todas las tablas/columnas históricas coincidieron antes y después de la adaptación.
- Alembic quedó en `49054796119c`, sin diferencias de esquema detectadas.
- La API comprobó `/health/ready` y los menús de los 20 negocios sobre PostgreSQL.
- Se conservaron `payments.created_at`, el tipo JSONB y los índices históricos de eventos.
- Los clientes históricos quedan sin consentimiento de WhatsApp por defecto.

El informe agregado está en `.local/recovery-integrity.json`, ignorado por Git. La rama original es el punto de recuperación; todavía no se ha exportado un respaldo independiente fuera de Neon.

`backend/adopt_legacy.py` revisa por defecto. Requiere el archivo de entorno y la identificación de la rama; `--apply` aplica solamente adiciones y el NOT NULL revisado de inventario. Rechaza borrados y cambios de tipo. La comprobación de datos y el registro de Alembic forman parte de la misma transacción. No ejecutarlo contra la rama original ni estampar manualmente una base incompleta.

## Publicar la API

1. Conectar Railway y comprobar que la cuenta permite Free sin tarjeta ni suscripción. Si exige un pago, detener esa vía.
2. Crear un proyecto con un único servicio desde `FerchoGG2006/hub`, rama `codex/platorin-readiness`. Usar la raíz del repositorio para detectar el Dockerfile. No crear PostgreSQL ni Redis en Railway.
3. Cargar las variables de `.local/free-host.env` por un canal seguro. Contiene una credencial nueva `platorin_app` con lectura/escritura en `public`, sin permisos de administración, y un JWT nuevo. Añadir `FRONTEND_URL` con el origen HTTPS exacto del frontend.
4. Mantener una réplica, activar la suspensión del servicio, usar el puerto `PORT` y dominio público de Railway. Healthcheck `/health/ready`. La base de recuperación ya está migrada. Futuras migraciones se ejecutan una sola vez con la credencial administrativa fuera del proceso público.
5. Revisar las credenciales heredadas que siguen válidas en la copia y rotarlas antes de publicar. La credencial nueva de aplicación no invalida las anteriores. Las claves de proveedores expuestas en el historial también requieren rotación antes de activarlas.

No añadir `railway.toml`: el sistema antiguo de Config as Code está deprecado. Esta preparación usa la detección del Dockerfile y la configuración del servicio.

## Publicar el frontend

Conectar la cuenta de Cloudflare, importar el mismo repositorio/rama en Pages Free y configurar Node 24, comando `npm run build`, salida `dist`. Establecer `VITE_API_URL=https://<dominio-api>` y `VITE_BASE_PATH=/`; no subir secretos como variables `VITE_`. Pages ofrece fallback SPA por defecto. Mantener las funciones dinámicas en la API externa.

Antes de dar por operativo el piloto: comprobar HTTPS, CORS, login, separación entre dos negocios y pedido → cocina → caja desde el sitio público. Pagos y WhatsApp quedan sin activar hasta disponer de credenciales nuevas y pruebas reales de sus proveedores. No se ha publicado todavía en Railway ni Cloudflare.

Fuentes oficiales: [Railway Free](https://docs.railway.com/pricing/free-plan), [Dockerfile](https://docs.railway.com/builds/dockerfiles), [infraestructura como código](https://docs.railway.com/infrastructure-as-code), [Neon](https://neon.com/pricing), [React en Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/).
