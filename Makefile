.PHONY: help build up down restart logs ps clean backup restore dev prod

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)Event Management - Docker Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

# Development commands
dev: ## Start development environment
	docker-compose up -d
	@echo "$(GREEN)Development environment started!$(NC)"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:5000"

dev-build: ## Build and start development environment
	docker-compose up -d --build
	@echo "$(GREEN)Development environment built and started!$(NC)"

dev-logs: ## Show development logs
	docker-compose logs -f

dev-down: ## Stop development environment
	docker-compose down
	@echo "$(GREEN)Development environment stopped!$(NC)"

# Production commands
prod: ## Start production environment
	docker-compose -f docker-compose.prod.yml up -d
	@echo "$(GREEN)Production environment started!$(NC)"

prod-build: ## Build and start production environment
	docker-compose -f docker-compose.prod.yml up -d --build
	@echo "$(GREEN)Production environment built and started!$(NC)"

prod-logs: ## Show production logs
	docker-compose -f docker-compose.prod.yml logs -f

prod-down: ## Stop production environment
	docker-compose -f docker-compose.prod.yml down
	@echo "$(GREEN)Production environment stopped!$(NC)"

# General commands
build: ## Build all containers
	docker-compose build

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## View logs from all services
	docker-compose logs -f

ps: ## List running containers
	docker-compose ps

# Service-specific commands
server-logs: ## View server logs
	docker-compose logs -f server

client-logs: ## View client logs
	docker-compose logs -f client

postgres-logs: ## View PostgreSQL logs
	docker-compose logs -f postgres

mongodb-logs: ## View MongoDB logs
	docker-compose logs -f mongodb

redis-logs: ## View Redis logs
	docker-compose logs -f redis

# Database commands
db-shell: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U postgres -d event_management

mongo-shell: ## Open MongoDB shell
	docker-compose exec mongodb mongosh event_management

redis-shell: ## Open Redis CLI
	docker-compose exec redis redis-cli

# Backup commands
backup: backup-postgres backup-mongodb ## Backup all databases
	@echo "$(GREEN)All databases backed up!$(NC)"

backup-postgres: ## Backup PostgreSQL database
	@mkdir -p backups
	docker-compose exec -T postgres pg_dump -U postgres event_management > backups/postgres_backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)PostgreSQL backup completed!$(NC)"

backup-mongodb: ## Backup MongoDB database
	@mkdir -p backups
	docker-compose exec mongodb mongodump --out=/tmp/backup
	docker-compose cp mongodb:/tmp/backup ./backups/mongodb_backup_$$(date +%Y%m%d_%H%M%S)
	@echo "$(GREEN)MongoDB backup completed!$(NC)"

restore-postgres: ## Restore PostgreSQL database (usage: make restore-postgres FILE=backup.sql)
	@if [ -z "$(FILE)" ]; then echo "Error: FILE parameter is required. Usage: make restore-postgres FILE=backup.sql"; exit 1; fi
	docker-compose exec -T postgres psql -U postgres event_management < $(FILE)
	@echo "$(GREEN)PostgreSQL restore completed!$(NC)"

# Cleanup commands
clean: ## Remove all containers, volumes, and images
	docker-compose down -v
	docker system prune -af
	@echo "$(GREEN)Cleanup completed!$(NC)"

clean-volumes: ## Remove all volumes (WARNING: This will delete all data!)
	docker-compose down -v
	@echo "$(GREEN)Volumes cleaned!$(NC)"

# Health checks
health: ## Check health of all services
	@echo "$(BLUE)Checking service health...$(NC)"
	@docker-compose ps
	@echo ""
	@echo "$(BLUE)Backend health:$(NC)"
	@curl -s http://localhost:5000/health || echo "Backend not responding"
	@echo ""
	@echo "$(BLUE)Frontend health:$(NC)"
	@curl -s http://localhost:3000/health || echo "Frontend not responding"

# Update commands
update: ## Pull latest images and restart services
	git pull
	docker-compose pull
	docker-compose up -d --build
	@echo "$(GREEN)Update completed!$(NC)"

# Setup commands
setup: ## Initial setup (copy env files)
	@if [ ! -f .env ]; then cp .env.docker .env; echo "$(GREEN).env file created! Please edit it with your values.$(NC)"; else echo "$(BLUE).env file already exists.$(NC)"; fi

install: setup build up ## Complete installation (setup, build, and start)
	@echo "$(GREEN)Installation completed!$(NC)"
	@echo "Please edit .env file and restart with: make restart"
