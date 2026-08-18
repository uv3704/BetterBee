# =============================================================================
# BetterBee — Developer Makefile
# =============================================================================

.PHONY: dev backend frontend celery infra migrate test lint format ollama-setup clean help

# --- Development ---

dev: ## Start backend + frontend concurrently
	@echo "🐝 Starting BetterBee development stack..."
	@$(MAKE) -j2 backend frontend

dev-all: infra ## Start all services including Redis and Celery
	@echo "🐝 Starting full BetterBee stack with Celery..."
	@$(MAKE) -j3 backend frontend celery

backend: ## Start FastAPI backend with hot reload
	cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

frontend: ## Start Next.js frontend dev server
	cd frontend && npm run dev

celery: ## Start Celery worker
	cd backend && uv run celery -A app.workers.celery_app worker -l WARNING --without-gossip --without-mingle --without-heartbeat -Q default,document_processing -c 2

# --- Infrastructure ---

infra: ## Start Docker infrastructure (Redis)
	docker compose up -d

infra-full: ## Start Docker infrastructure (Redis + PostgreSQL)
	docker compose --profile local-db up -d

infra-down: ## Stop Docker infrastructure
	docker compose --profile local-db down

# --- Database ---

migrate: ## Run Alembic migrations
	cd backend && source .venv/bin/activate && \
	alembic upgrade head

migrate-create: ## Create new migration (usage: make migrate-create MSG="add users table")
	cd backend && source .venv/bin/activate && \
	alembic revision --autogenerate -m "$(MSG)"

migrate-down: ## Rollback last migration
	cd backend && source .venv/bin/activate && \
	alembic downgrade -1

# --- Testing ---

test: ## Run all tests
	cd backend && source .venv/bin/activate && \
	pytest -v --cov=app --cov-report=term-missing
	cd frontend && npm run lint && npx tsc --noEmit

test-backend: ## Run backend tests only
	cd backend && source .venv/bin/activate && \
	pytest -v --cov=app --cov-report=term-missing

test-frontend: ## Run frontend lint + type check
	cd frontend && npm run lint && npx tsc --noEmit

# --- Code Quality ---

lint: ## Lint all code
	cd backend && source .venv/bin/activate && ruff check .
	cd frontend && npm run lint

format: ## Format all code
	cd backend && source .venv/bin/activate && ruff format .
	cd frontend && npx prettier --write "src/**/*.{ts,tsx,css}"

# --- AI Setup ---

ollama-setup: ## Pull required Ollama models
	@echo "🤖 Pulling Ollama models..."
	ollama pull llama3.2:3b
	ollama pull nomic-embed-text
	@echo "✅ Ollama models ready"

# --- Cleanup ---

clean: ## Remove all generated files
	find backend -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	rm -rf backend/.pytest_cache backend/.ruff_cache backend/.mypy_cache
	rm -rf backend/chroma_data
	rm -rf frontend/.next frontend/node_modules

# --- Help ---

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
