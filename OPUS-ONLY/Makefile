.PHONY: help setup start stop logs shell test clean deploy-prod backup restore

help:
	@echo "YouAndINotAI Backend — Docker Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make setup          — Copy .env.example to .env"
	@echo ""
	@echo "Development:"
	@echo "  make start          — Start docker-compose (development)"
	@echo "  make stop           — Stop all containers"
	@echo "  make restart        — Restart all containers"
	@echo "  make logs           — View logs (all services)"
	@echo "  make logs-app       — View app logs only"
	@echo "  make logs-db        — View PostgreSQL logs"
	@echo "  make logs-redis     — View Redis logs"
	@echo ""
	@echo "Shell Access:"
	@echo "  make shell-app      — Shell into FastAPI container"
	@echo "  make shell-db       — Shell into PostgreSQL container"
	@echo "  make shell-redis    — Shell into Redis container"
	@echo ""
	@echo "Database:"
	@echo "  make db-init        — Initialize/reset database"
	@echo "  make db-backup      — Create manual backup"
	@echo "  make db-restore     — Restore from backup (requires BACKUP_FILE)"
	@echo "  make db-shell       — Interactive psql shell"
	@echo ""
	@echo "Testing & Quality:"
	@echo "  make test           — Run pytest"
	@echo "  make lint           — Run flake8 linter"
	@echo "  make format         — Format code with black"
	@echo "  make type-check     — Type checking with mypy"
	@echo ""
	@echo "Production:"
	@echo "  make deploy-prod    — Deploy production stack"
	@echo "  make stop-prod      — Stop production stack"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean          — Remove containers & volumes"
	@echo "  make clean-build    — Clean Docker build cache"

setup:
	@test -f .env || (cp .env.example .env && echo "✓ .env created — edit with your credentials")
	@test -f .env && echo "✓ .env already exists"

start:
	docker compose up

start-d:
	docker compose up -d

stop:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f

logs-app:
	docker compose logs -f app

logs-db:
	docker compose logs -f postgres

logs-redis:
	docker compose logs -f redis

logs-nginx:
	docker compose logs -f nginx

shell-app:
	docker compose exec app sh

shell-db:
	docker compose exec postgres bash

shell-redis:
	docker compose exec redis redis-cli

db-init:
	docker compose exec postgres psql -U uandinotai -d uandinotai_dating -f /docker-entrypoint-initdb.d/01-schema.sql

db-backup:
	@mkdir -p backups
	@docker compose exec postgres pg_dump -U uandinotai -d uandinotai_dating | gzip > backups/uandinotai_manual_$(shell date +%Y%m%d_%H%M%S).sql.gz
	@echo "✓ Backup created: backups/uandinotai_manual_*.sql.gz"

db-restore:
	@test -n "$(BACKUP_FILE)" || (echo "Usage: make db-restore BACKUP_FILE=backups/uandinotai_*.sql.gz" && exit 1)
	@echo "Restoring from $(BACKUP_FILE)..."
	gunzip < $(BACKUP_FILE) | docker compose exec -T postgres psql -U uandinotai -d uandinotai_dating
	@echo "✓ Restore complete"

db-shell:
	docker compose exec postgres psql -U uandinotai -d uandinotai_dating

test:
	docker compose exec app pytest

lint:
	docker compose exec app flake8 app/

format:
	docker compose exec app black app/

type-check:
	docker compose exec app mypy app/

deploy-prod:
	docker compose -f docker-compose.prod.yml up -d
	@echo "✓ Production stack deployed"
	@echo "Monitor with: docker compose -f docker-compose.prod.yml logs -f"

stop-prod:
	docker compose -f docker-compose.prod.yml down
	@echo "✓ Production stack stopped"

health:
	curl -s http://localhost/api/v1/health | jq .

docs:
	@echo "API Documentation: http://localhost/api/v1/docs"
	open http://localhost/api/v1/docs 2>/dev/null || echo "Visit: http://localhost/api/v1/docs"

clean:
	docker compose down -v
	@echo "✓ Containers and volumes removed"

clean-build:
	docker system prune -f
	@echo "✓ Build cache cleaned"

build:
	docker compose build

build-prod:
	docker build -t youandinotai-backend:latest .
	@echo "✓ Image built: youandinotai-backend:latest"

push:
	@test -n "$(REGISTRY)" || (echo "Usage: make push REGISTRY=us-east1-docker.pkg.dev/project/dateapp" && exit 1)
	docker tag youandinotai-backend:latest $(REGISTRY)/backend:latest
	docker push $(REGISTRY)/backend:latest
	@echo "✓ Image pushed to $(REGISTRY)"

status:
	@echo "=== Docker Compose Status ===" 
	docker compose ps
	@echo ""
	@echo "=== Health Checks ===" 
	@echo -n "API Health: "
	@curl -s http://localhost/api/v1/health | jq .status -r 2>/dev/null || echo "DOWN"
	@echo -n "Database: "
	@docker compose exec postgres pg_isready -U uandinotai 2>/dev/null | grep accepting && echo "UP" || echo "DOWN"
	@echo -n "Redis: "
	@docker compose exec redis redis-cli ping 2>/dev/null && echo "UP" || echo "DOWN"
	@echo -n "Nginx: "
	@curl -s http://localhost/ > /dev/null && echo "UP" || echo "DOWN"

version:
	@docker compose exec app python -c "import fastapi; print(f'FastAPI {fastapi.__version__}')"
	@docker compose exec postgres postgres --version
	@docker compose exec redis redis-server --version

tree:
	@echo "Project Structure:"
	@tree -L 2 -I '__pycache__|*.pyc|node_modules' . 2>/dev/null || find . -maxdepth 2 -not -path '*/\.*' -not -path '*/[._]' | sort | sed 's|[^/]*/| |g'

.DEFAULT_GOAL := help
