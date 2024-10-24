#MAKEFILE
.PHONY: help rundev run_backend run_docker_redis stop_docker_redis clean

# Define a list of possible virtual environment directories
POSSIBLE_VENVS = venv .venv env myenv

# Allow passing VENV_PATH as an argument. If not passed, attempt to auto-detect.
VENV_PATH ?= $(shell for dir in $(POSSIBLE_VENVS); do \
                    if [ -d "$$dir" ]; then \
                        echo $$dir; \
                        break; \
                    fi; \
                 done)
	

# Show available commands
help:
	@echo "Available commands:"
	@echo "  make rundev                  - Start Django development server and Redis (Dockerized Redis)."
	@echo "                                Use VENV_PATH=<path> to specify a custom virtual environment path."
	@echo "                                Example: make rundev VENV_PATH=/path/to/your/venv"
	@echo "  make re-rundev               - Restart Django development server and Redis, removing all Redis data."
	@echo "  make run_backend             - Start only the Django development server."
	@echo "  make run_docker_redis        - Start Redis server in Docker."
	@echo "  make stop_docker_redis       - Stop the Redis Docker container, retaining data."
	@echo "  make stop_docker_redis_clean - Stop Redis and remove all data (volume is deleted)."
	@echo "  make up-dev                  - Start the development environment (using Docker Compose) with automatic build."
	@echo "  make down-dev                - Stop and remove all containers in the development environment."
	@echo "  make clean                   - Clean up and remove temporary files (e.g., .pyc and __pycache__)."
	@echo "  make install_dependencies    - Install project dependencies and upgrade pip inside the virtual environment."
	@echo "  make migrate                 - Apply Django migrations in the specified environment."
	@echo "  make check_venv              - Check if a virtual environment is active, otherwise prompt to activate or create one."



# Run Django development server and Redis (Dockerized Redis)
rundev: check_venv install_dependencies migrate run_docker_redis run_backend

# Re-run the development environment with a clean Redis setup
re-rundev: stop_docker_redis_clean rundev


check_venv:
	@if [ -z "$(VENV_PATH)" ]; then \
		echo "It looks like the virtual environment was not found."; \
		echo "We checked for: $(POSSIBLE_VENVS)."; \
		echo "Please create a virtual environment with something like:"; \
		echo "python3 -m venv venv"; \
		echo "Alternatively, you can specify your virtual environment path when running the Makefile like this:"; \
		echo "make rundev VENV_PATH=path/to/your/venv"; \
		exit 1; \
	fi; \
	if [ -z "$$VIRTUAL_ENV" ]; then \
		echo "Error: The virtual environment is not activated."; \
		echo "Please activate it with:"; \
		echo "source $(VENV_PATH)/bin/activate"; \
		exit 1; \
	else \
		echo "Virtual environment activated at: $(VENV_PATH)"; \
	fi


# Apply migrations
migrate: check_venv
	@echo "Applying migrations..."
	$(VENV_PATH)/bin/python src/backend/django/tr_django/manage.py migrate

# Install project dependencies inside virtual environment and upgrade pip before
install_dependencies: check_venv
	@echo "Upgrading pip..."
	$(VENV_PATH)/bin/pip install --upgrade pip
	@echo "Installing dependencies..."
	$(VENV_PATH)/bin/pip install -r src/backend/django/requirements.txt



# Run Django development server
run_backend: check_venv
	@echo "Starting Django development server..."
	python src/backend/django/tr_django/manage.py runserver 127.0.0.1:8000

# Start Redis in Docker
run_docker_redis:
	@echo "Starting Redis server in Docker..."
	@if docker ps -a --filter "name=redis-dev" | grep "redis-dev"; then \
		echo "Redis container already exists. Starting it..."; \
		docker start redis-dev; \
	else \
		docker run --name redis-dev -p 6379:6379 -d redis; \
	fi

# Stop Redis Docker container
stop_docker_redis:
	@echo "Stopping Redis server in Docker..."
	docker stop redis-dev || true
	docker rm redis-dev || true

# Stop Redis Docker container and remove the data (volume is deleted)
stop_docker_redis_clean:
	@echo "Stopping Redis server in Docker and removing data..."
	docker stop redis-dev || true
	docker rm -v redis-dev || true

# Development environment
up-dev:
	@echo "Starting development environment..."
	docker compose up --build

# Stop and remove containers for Development
down-dev:
	@echo "Stopping development environment..."
	docker compose down

# Clean up temporary files (extend this based on specific project needs)
clean:
	@echo "Cleaning up temporary files..."
	find . -name "*.pyc" -delete
	find . -name "__pycache__" -delete
