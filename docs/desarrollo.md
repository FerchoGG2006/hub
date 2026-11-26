# Desarrollo local de Platorin

El frontend usa Node 24. La API usa Python 3.12. Nunca ejecutar el entorno antiguo de `backend/venv`.

## Preparación en Windows

Desde la raíz del proyecto:

```powershell
npm ci
python -m uv python install 3.12
python -m uv venv --python 3.12 .venv
python -m uv pip install --python .venv/Scripts/python.exe -r backend/requirements-dev.txt
Copy-Item backend/.env.example backend/.env
```

Completar JWT_SECRET_KEY con un secreto aleatorio de al menos 32 caracteres en el archivo local. No usar las claves antiguas publicadas. DATABASE_URL de la plantilla apunta exclusivamente a SQLite local. No copiar configuraciones de producción para hacer pruebas.

Desde `backend`:

```powershell
../.venv/Scripts/python.exe -m alembic upgrade head
../.venv/Scripts/python.exe manage.py demo
```

Volver a la raíz e iniciar:

```powershell
npm run dev:all
```

- Menú: http://127.0.0.1:3000/demo
- Panel: http://127.0.0.1:3000/admin/demo
- API: http://127.0.0.1:8000/docs
- Disponibilidad de API y esquema: http://127.0.0.1:8000/health/ready
- Credenciales generadas: `.local/access.json`, excluido de Git. El comando demo no sobrescribe usuarios ni crea ventas ficticias.

Los dos procesos quedan vinculados por concurrently. Ctrl+C los detiene. El script de arranque selecciona el Python de `.venv` en Windows, Linux o macOS.

## Comprobaciones

```powershell
npm run lint
npm run build
npm audit
.venv/Scripts/python.exe -m pytest backend/tests -q
.venv/Scripts/python.exe -m pip_audit -r backend/requirements.lock --no-deps --disable-pip
```

Pruebas con dos negocios y una base SQLite temporal aislada: contraseñas y migración de hashes, límites de login, importes de catálogo, inventario concurrente, reintentos, acceso a pedidos, WebSockets públicos/administrativos, firma y conciliación Wompi simulada, cocina, caja y cancelaciones. Las migraciones también se ejecutan desde una base vacía y se comprueba que no haya diferencias respecto al modelo.

## Integraciones

El pedido en efectivo se registra sin WhatsApp configurado; no se abre un número de ejemplo. El negocio configura su WhatsApp real y el cliente decide cuándo abrirlo. La carta independiente `/menu-platorin` es una demostración; su WhatsApp permanece deshabilitado si no se configura VITE_DEMO_WHATSAPP_NUMBER.

Wompi necesita sus propias claves sandbox y secretos de integridad y eventos. Las pruebas automáticas usan valores ficticios sin comunicarse con la pasarela. Meta, correo, Gemini y Cloudinary requieren configuración aparte; no se han probado con credenciales reales.

Los WebSockets públicos reciben solo cambios de menú. El panel usa `/ws/admin/{tenant_id}` y envía el JWT en el primer mensaje; el token no viaja en la URL.

Los pedidos públicos devuelven orderToken para consultar el estado y crear una sesión de pago. No confundirlo con un JWT administrativo. El total de catálogo se recalcula en servidor; no se añade una tarifa de domicilio fija desde el navegador.

El carrito conserva la clave de reintento hasta vaciarse. El pago y la preparación tienen estados separados para mantener las ventas cobradas mientras cocina avanza.
