FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3-pip \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY agent/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY agent/ /app/agent/
COPY start.sh /app/

RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]
