FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    AUTO_CREATE_SCHEMA=false \
    ENABLE_SCHEDULER=false \
    ENABLE_WHATSAPP_RECOVERY=false \
    SEED_DEMO_DATA=false

WORKDIR /app
COPY backend/requirements.lock ./requirements.lock
RUN pip install --no-cache-dir -r requirements.lock \
    && useradd --uid 10001 --create-home app
COPY --chown=app:app backend/ ./
USER app
EXPOSE 8000
CMD ["sh", "-c", "exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]
