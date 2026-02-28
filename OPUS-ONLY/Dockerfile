FROM python:3.11-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    gcc \
    musl-dev \
    postgresql-client \
    curl

# Install Python dependencies
RUN pip install --no-cache-dir \
    fastapi==0.104.1 \
    uvicorn[standard]==0.24.0 \
    sqlalchemy==2.0.23 \
    asyncpg==0.29.0 \
    stripe==7.0.0 \
    httpx==0.25.1 \
    pydantic-settings==2.1.0 \
    python-dotenv==1.0.0 \
    redis==5.0.1 \
    gunicorn==21.2.0

# Copy application code
COPY ./app /app/app
COPY ./requirements.txt /app/requirements.txt 2>/dev/null || true

# Create non-root user
RUN addgroup -S appuser && adduser -S appuser -G appuser
RUN chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

# Run with gunicorn + uvicorn (Cloud Run compatible)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
