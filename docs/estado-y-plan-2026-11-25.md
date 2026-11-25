# Platorin: estado verificado y plan de recuperación

Revisión: 25 de noviembre de 2026. Repositorio: FerchoGG2006/hub.
Base revisada: main, commit 0d9f62fac9386e76f62084d0a2b70da196868d68.

## Último trabajo y despliegue comprobable

- 24–26 de mayo: mejoras de cocina, onboarding, campañas de WhatsApp, presencia y eventos por WebSocket.
- 8–9 de junio: arquitectura y API multitenant, modelos de inventario, automatización y dashboard.
- 28 de junio: el mensaje del commit menciona multitenancy, autenticación, rutas y carrito. Su diff concreto añade la carta de Más Perrón, imágenes, BottomSheet, MenuCard y CartFooter, junto con una ruta `/menu-platorin` en App.jsx. Esa carta tiene productos fijos y un WhatsApp de ejemplo; no registra pedidos en la API.
- El workflow del 28 de junio terminó correctamente, pero despliega únicamente el frontend en GitHub Pages. No prueba que Render desplegara la API ni que los flujos de negocio funcionaran.
- Las conversaciones anteriores «Auditar proyecto HUB» y «Auditar y decidir repositorio» contienen diagnósticos y propuestas; no acreditan correcciones posteriores.

Fuentes:
- Commit: https://github.com/FerchoGG2006/hub/commit/0d9f62fac9386e76f62084d0a2b70da196868d68
- Workflow: https://github.com/FerchoGG2006/hub/actions/runs/28330027316
- Definiciones locales: `.github/workflows/deploy.yml`, `render.yaml`, `component_logic.md`, `menu_structure.md`.

## Comprobación pública actual

Consultas GET sin credenciales ni escrituras:

| Dirección | Resultado |
| --- | --- |
| https://platorin.com | HTTP 503, página «Service Suspended» |
| https://hub-frontend-bbaa.onrender.com | HTTP 503 |
| https://hub-api-2lql.onrender.com | HTTP 503, página «Service Suspended» |
| https://ferchogg2006.github.io/hub/ | HTML HTTP 200, pero los cuatro assets JS/CSS enlazados bajo `/assets/` devuelven 404 |

No se ha accedido al panel de Render: la causa de suspensión, la base de datos disponible, los respaldos y las variables efectivas siguen sin comprobar. Un HTML 200 en Pages no equivale a una aplicación operativa. `base href="/"`, rutas absolutas y BrowserRouter necesitan una estrategia de alojamiento coherente.

## Bloqueos prioritarios

### P0: antes de reactivar ventas o exponer datos reales

1. **Credenciales públicas.** `render.yaml` incluía credenciales de base de datos, Gemini, JWT y Meta. También existen secretos de Wompi por defecto en `backend/core/payments/wompi_provider.py`. Retirarlos de archivos actuales no los borra del historial ni los invalida. Rotar en cada proveedor, actualizar el entorno de despliegue y revisar el historial y otros archivos antes de publicar. No registrar valores en este informe.
2. **JWT y contraseñas.** `backend/auth.py:15` usa `JWT_SECRET_KEY` con un valor fijo de respaldo; Render declaraba `JWT_SECRET`, que no consume ese módulo. Las contraseñas usan SHA-256 sin sal (`auth.py:21`). Unificar la configuración, exigir secreto válido al arrancar, usar un hash de contraseñas adecuado con migración y limitar intentos de login. Cambiar el secreto invalida sesiones existentes.
3. **Pedidos e inventario.** `backend/src/modules/orders/service.py:41` acepta el total enviado por el cliente. Las búsquedas de inventario no filtran por negocio y no usan una actualización condicional que proteja contra concurrencia. Validar productos, variantes y sede del tenant; recalcular importes en servidor; rechazar cantidades inválidas o stock insuficiente y proteger reintentos para evitar duplicados.
4. **Consulta cruzada de pedidos.** `backend/src/modules/orders/router.py:30` recibe un slug, pero consulta el pedido solamente por ID. Resolver el tenant y comprobar pertenencia; definir autorización o un identificador público no predecible para el seguimiento.
5. **WebSockets sin autorización.** `backend/main.py:97` acepta un tenant numérico y el manager abre la conexión sin comprobar permisos. Los eventos incluyen nombre del cliente, productos y total. Separar eventos públicos de eventos administrativos y autorizar cada suscripción antes de aceptar el socket.
6. **Cobros y suscripciones.** `verify_webhook_signature` permite el evento si falta firma o secreto; el handler además captura excepciones HTTP y devuelve 200. La ruta `/admin/billing/subscribe` activa 30 días sin una confirmación de pago. Validar la integración completa, firmas, importes, moneda, referencia e idempotencia; no habilitar acceso de pago con una llamada del cliente. La configuración declarada sigue en sandbox.

### P1: operación confiable y entorno reproducible

- Recuperar servicios de Render y comprobar salud real de la base de datos y Redis. Confirmar el dominio canónico y qué plataforma alojará el frontend.
- Crear un entorno Python nuevo. El repositorio sigue **5.722 archivos dentro de backend/venv**; ese entorno contiene rutas de otra máquina y no debe usarse como instalación local. El equipo tiene Python 3.14 y el proyecto fija paquetes antiguos: validar compatibilidad antes de instalar. No se ha arrancado ni probado el backend en esta revisión.
- Corregir lint: quedan **10 errores y 3 advertencias del frontend**. Inicialmente `npm run lint` informaba 129 errores y 3 advertencias porque analizaba también dependencias del entorno virtual.
- Eliminar del seguimiento los entornos virtuales y acordar cómo manejar `dist` y archivos comprimidos. No se han eliminado en esta intervención.
- Sustituir `create_all()` por migraciones versionadas y comprobar respaldo/restauración antes de cambiar esquemas.
- Evitar que APScheduler se inicie al importar y ejecute el mismo trabajo en cada réplica.
- Separar los datos de demostración: el alta de negocios llama a `seed_restaurant_demo`, que crea clientes, pedidos y métricas ficticias.
- Añadir comprobaciones automáticas del backend y de flujos de negocio a CI. La compilación actual no detecta errores de autorización ni de cobro.

### P2: completar producto y rendimiento

- Conectar la carta nueva al negocio y catálogo reales, configurar el WhatsApp correcto y decidir si el pedido se registra antes de abrir WhatsApp.
- Consolidar los dos motores de carta/carrito para que productos, cantidades, precios y disponibilidad tengan las mismas reglas.
- Centralizar la API y la sesión: App.jsx reemplaza globalmente `window.fetch`; existe además un cliente Axios sin dependencia directa declarada en package.json.
- Dividir la carga del frontend: el bundle principal compilado ronda 1,48 MB sin comprimir.
- Probar móvil, navegación por teclado, estados vacíos, errores de red, recuperación del carrito y reconexión en tiempo real.
- Después de estabilizar pedidos, cocina y caja, validar por separado IA, campañas de Meta y automatizaciones. La existencia de código no prueba una integración operativa.

## Primeros cambios locales realizados

Rama: `codex/platorin-readiness`. Sin push ni despliegue.

- `render.yaml`: reemplazados los cinco secretos literales por `sync: false`; añadidas las variables JWT_SECRET_KEY y WOMPI_INTEGRITY_SECRET. Continúa siendo necesario rotar credenciales y retirar los otros secretos identificados.
- `package.json` y lock: nombre del paquete actualizado a platorin. El comando de backend local usa ahora 127.0.0.1:8000, alineado con el frontend.
- `.env.example` y `backend/.env.example`: plantillas sin credenciales para configurar ambos procesos. La base SQLite se declara explícitamente: `backend/database.py` exige DATABASE_URL aunque otra clase de settings tenga un valor de respaldo.
- `.gitignore`: añadidas variantes de .env y .venv, conservando plantillas de ejemplo.
- `eslint.config.js`: excluidos entornos virtuales del análisis JavaScript.
- `useWebSocket.js`: el host de WebSocket se deriva de VITE_API_URL, con wss para HTTPS y opción de override. Esto corrige la URL; no añade autorización.

Validación: `npm run build` correcto; `git diff --check` correcto. El lint del código fuente sigue fallando con los 10 errores indicados. Los archivos de dist modificados por la compilación se restauraron para no mezclar artefactos con el cambio de configuración.

## Secuencia para operar de principio a fin

1. Rotar secretos, cerrar los P0 con pruebas de regresión y preparar variables de entorno.
2. Levantar API local aislada y validar esquema, fixtures de dos negocios y pruebas de aislamiento.
3. Validar alta → login → catálogo → QR → carrito → pedido → cocina → caja; comprobar recarga, dos clientes simultáneos y reintentos.
4. Validar pagos sandbox y webhooks; separar pruebas y datos demo de los negocios reales.
5. Recuperar infraestructura, desplegar una revisión verificada y ejecutar pruebas sobre el dominio definitivo. Confirmar respaldos y observabilidad antes de incorporar un negocio piloto.

No se asigna un porcentaje de terminación: faltan pruebas funcionales y acceso al estado efectivo de producción. La compilación del frontend está comprobada; la operación completa todavía no.
