# Recuperación de producción

Actualización del 26 de noviembre: el usuario descartó pagar Render. La ruta vigente y la recuperación de datos Neon se documentan en [alojamiento-gratuito.md](alojamiento-gratuito.md). Los pasos de Render siguientes son el plan anterior y no deben ejecutarse para este piloto. La copia Neon ya fue adaptada y validada; la rama original se conserva.

## Preparado en código

- Python 3.12, dependencias fijadas en requirements.lock, Node 24 y npm ci.
- Migraciones Alembic, endpoint /health/ready y CI con pruebas, lint y auditorías.
- Render conserva los nombres de servicio existentes. El frontend usa serve instalado como dependencia; las claves se configuran fuera del repositorio.
- Pages genera assets bajo /hub/ y un fallback SPA. Es una publicación alternativa: no sustituye la API de Render.

## Pasos que requieren el acceso efectivo a Render y proveedores

1. Verificar por qué están suspendidos los servicios y qué base PostgreSQL sigue disponible. No crear recursos ni aceptar cargos para reemplazarlos sin conocer el estado y el costo.
2. Descargar y verificar un respaldo recuperable de la base antes de migrar. Conservar la revisión anterior para una reversión de aplicación.
3. Rotar credenciales de PostgreSQL, JWT, Gemini, Meta y Wompi expuestas. El ZIP público también contenía archivos .env. Su retirada del último commit no limpia el historial ni invalida claves. Revisar las otras variables de esos .env sin publicarlas.
4. Configurar JWT_SECRET_KEY (secreto aleatorio nuevo), DATABASE_URL, FRONTEND_URL, VITE_API_URL y las integraciones que realmente se usarán. La rotación JWT cerrará sesiones anteriores.
5. Preparar el esquema según el caso siguiente. No arrancar esta revisión contra una base sin migrar.
6. Desplegar API y frontend; comprobar /health/ready, origen CORS, login, aislamiento de dos negocios y recorrido de pedido → cocina → caja.
7. Configurar webhook sandbox de Wompi en /payments/webhook y comprobar pago válido, firma inválida, importe incorrecto, duplicado y fallo temporal. Pasar a producción solo con claves y pruebas del comercio real.

La base original de producción no se modificó. Se adaptó únicamente la rama de recuperación indicada en el documento actualizado.

## Esquema nuevo

Desde backend, con DATABASE_URL proporcionada por el entorno seguro del servicio:

```text
alembic upgrade head
alembic check
```

## Base histórica existente sin Alembic

Primero respaldo. Ejecutar `python manage.py check-legacy-schema`: es una comprobación de tablas, columnas y afinidad de tipos, sin escrituras. Si falla, revisar las diferencias antes de continuar. También revisar manualmente índices, claves foráneas, restricciones y tipos específicos del motor: el comando no sustituye esa comprobación.

Solo después de confirmar que la base representa la revisión histórica inicial:

```text
alembic stamp b43551d67342
alembic upgrade head
alembic check
```

La segunda revisión añade la tabla de claves de reintento y los campos de pago. Los pedidos históricos identificados como pagados se conservan como tales; como antes no existía fecha de cobro, paid_at se aproxima con created_at. Revisar las cifras históricas por esa limitación. No ejecutar stamp contra una base desconocida o incompleta.

## Operación y límites pendientes

- Mantener una sola instancia y un solo proceso de API mientras el scheduler esté integrado. Los trabajos arrancan y se detienen con la aplicación; no al importar módulos. Los límites de solicitudes son por proceso. Antes de escalar, separar scheduler y usar un limitador compartido.
- Las pruebas locales cubren SQLite; sigue pendiente ejecutarlas contra PostgreSQL y comprobar la infraestructura real.
- La activación de suscripciones sin pago está bloqueada. Falta implementar el cobro comercial de la plataforma y su activación verificada; el checkout de pedidos del restaurante es un flujo separado.
- Una cancelación de un pedido ya pagado requiere un proceso de devolución. No se automatizan reembolsos en este cambio.
- IA y automatizaciones de marketing no forman parte de la validación operativa realizada. El SDK antiguo de Gemini requiere una actualización posterior.
- Los secretos permanecen en el historial publicado: rotarlos es obligatorio; cualquier reescritura del historial se hará como una operación separada y coordinada.

Referencias: [Render Blueprint](https://render.com/docs/blueprint-spec), [eventos Wompi](https://docs.wompi.co/docs/colombia/eventos/).
