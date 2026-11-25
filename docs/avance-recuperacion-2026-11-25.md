# Recuperación local verificada — 25 de noviembre de 2026

Platorin funciona localmente con frontend React y API FastAPI, Python 3.12, SQLite migrada y un negocio de demostración. La publicación real de Render todavía no se ha recuperado: falta acceso a la cuenta, revisar la base histórica y rotar secretos.

## Validación realizada

- 16 pruebas de backend aprobadas, incluyendo migraciones desde cero y comparación del esquema.
- Lint y compilación del frontend aprobados.
- Auditorías de npm y de requirements.lock: sin vulnerabilidades conocidas informadas al revisar estas versiones.
- API local /health/ready: HTTP 200, con conexión y columna de esquema comprobadas.
- Navegador: carta real de la API, añadir al carrito, pedido en efectivo confirmado, login administrativo, recepción en cocina y cambio a preparación; módulo de caja accesible. La cuenta temporal usada en la prueba se eliminó después de cerrar sesión.
- Compilación alternativa para Pages: rutas de assets bajo /hub/ verificadas.
- Separación de carga por rutas: archivo JS principal bajó de aproximadamente 1,48 MB a 391 KB sin comprimir. El panel administrativo sigue teniendo un chunk grande, de unos 754 KB.

## Cambios principales

- Contraseñas con sal y PBKDF2; actualización de hashes SHA-256 al iniciar sesión; JWT sin clave fija de respaldo; límites de login y registro por proceso.
- Pedidos recalculados con el catálogo, aislamiento de productos/variantes/sede y validación de negocio activo. Stock reservado de forma condicional; cancelaciones no pagadas devuelven existencias. Reintentos del checkout conservan una clave para evitar duplicados.
- Token separado por pedido para consultar estado y abrir pagos. WebSockets administrativos autenticados y eventos públicos limitados a cambios de menú.
- Firmas Wompi verificadas con propiedades y timestamp del evento; validación de referencia, moneda e importe, consulta de confirmación a la pasarela, rechazo de eventos inválidos y conservación de errores que deben reintentarse.
- Pago y cocina tienen estados separados. Caja calcula ventas cobradas y movimientos de turno. La suscripción de la plataforma ya no se activa sin un pago verificado.
- Alembic sustituye el esquema automático por defecto; scheduler controlado por el ciclo de vida y configuración. Datos demo y recuperación automática por WhatsApp deshabilitados por defecto.
- Números de ejemplo retirados del checkout operativo; recomendaciones del catálogo real; errores de pago visibles. Inicio local conjunto y codificación UTF-8 en Windows.
- Dependencias actualizadas y fijadas; CI para frontend y backend, despliegue Pages con subruta y configuración Render sin secretos literales.
- Retirados del seguimiento el entorno virtual, bytecode, dist y el ZIP que contenía .env. Se conservaron las copias locales; los secretos antiguos siguen en el historial y necesitan rotación.

## Acceso y pendientes

Menú local: http://127.0.0.1:3000/demo. Panel: http://127.0.0.1:3000/admin/demo. Las credenciales están en `.local/access.json`, excluido de Git.

Consultar `desarrollo.md` para reproducir el entorno y `recuperacion-produccion.md` para recuperar servicios y migrar una base existente. Todavía faltan validación contra PostgreSQL, claves reales de integraciones, facturación comercial de la plataforma y devoluciones. Las pruebas de Wompi son simuladas; no se han movido fondos ni enviado campañas.
