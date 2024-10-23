#MAKEFILE
.PHONY: help rundev run_backend run_docker_redis stop_docker_redis clean

# Allow passing the virtual environment path as an argument
# If not provided, check for a default virtual environment in common directories
VENV_PATH ?=
POSSIBLE_VENVS = venv .venv env myenvyenv

# Show available commands
help:
	@echo "Available commands:"
	@echo "  make rundev             - Start Django development server and Redis (Dockerized Redis)."
	@echo "                           Use VENV_PATH=<path> to specify a custom virtual environment path."
	@echo "                           Example: make rundev VENV_PATH=/path/to/your/venv"
	@echo "  make run_backend        - Start only Django development server."
	@echo "  make run_docker_redis   - Start Redis server in Docker."
	@echo "  make stop_docker_redis  - Stop the Redis Docker container."
	@echo "  make clean              - Clean up and remove temporary files."


# Run Django development server and Redis (Dockerized Redis)
rundev: check_venv install_dependencies migrate run_docker_redis run_backend


check_venv:
	@if [ -z "$(VENV_PATH)" ]; then \
		VENV_DIR=""; \
		echo "VENV_PATH is not set, checking for possible virtual environments..."; \
		for dir in $(POSSIBLE_VENVS); do \
			if [ -d "$$dir" ]; then \
				VENV_DIR="$$dir"; \
				break; \
			fi; \
		done; \
		if [ -z "$$VENV_DIR" ]; then \
			echo "It looks like the virtual environment was not found."; \
			echo "We checked for: $(POSSIBLE_VENVS)."; \
			echo "Please create a virtual with environment something like:"; \
			echo "python3 -m venv venv"; \
			echo "Alternatively, you can add the name of your virtual environment folder in the Makefile adding it to the POSSIBLE_VENVS variable."; \
			exit 1; \
		fi; \
		VENV_PATH="$$VENV_DIR"; \
	else \
		echo "Using provided virtual environment: $$VENV_PATH"; \
	fi; \
	if [ -z "$$VIRTUAL_ENV" ]; then \
		echo "Error: The virtual environment is not activated."; \
		echo "Please activate it with:"; \
		echo "source $$VENV_DIR/bin/activate"; \
		exit 1; \
	else \
		echo "Virtual environment activated at: $$VENV_DIR"; \
	fi

# Apply migrations
migrate: 
	@echo "Applying migrations..."
	venv/bin/python src/backend/django/tr_django/manage.py migrate

# Install project dependencies inside virtual environment
install_dependencies:
	@echo "Installing dependencies..."
	@venv/bin/pip install -r src/backend/django/requirements.txt


# Run Django development server
run_backend: 
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

# Clean up temporary files (extend this based on specific project needs)
clean:
	@echo "Cleaning up temporary files..."
	find . -name "*.pyc" -delete
	find . -name "__pycache__" -delete
