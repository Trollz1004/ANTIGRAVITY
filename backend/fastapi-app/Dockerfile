FROM python:3.11-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    gcc \
    musl-dev \
    postgresql-dev \
    postgresql-client \
    curl \
    libffi-dev

# Copy and install Python dependencies first (Docker layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY ./app /app/app

# Create non-root user
RUN addgroup -S appuser && adduser -S appuser -G appuser
RUN chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Healthcheck — uses /api/v1/health (handles DB + Redis status)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

# Cloud Run compatible — uses $PORT env or defaults to 8000.
# Schema reconciliation runs inside app lifespan (reconcile_legacy_schema).
# alembic is NOT run here — it caused container restart loops when DB timing
# or migration state didn't align (alembic failure → uvicorn never starts →
# healthcheck fails → Docker restart loop). Run migrations manually or via
# a separate init container when needed.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
