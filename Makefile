# Makefile for data-collector-frontend
# Usage:
#   make build
#   make run
#   make docker-build
#   make docker-run

APP_NAME = data-collector-frontend
DOCKER_IMAGE = data-collector-frontend
DOCKER_TAG ?= latest
DOCKER_REGISTRY ?= 

.PHONY: all build run clean help docker-build docker-run docker-stop docker-clean docker-push

all: help

help:
	@echo "Usage: make <target>"
	@echo "Targets:"
	@echo "  build         - Build the project"
	@echo "  run           - Run the project in dev mode"
	@echo "  clean         - Clean the project"
	@echo "  docker-build  - Build Docker image"
	@echo "  docker-run    - Run Docker container"
	@echo "  docker-stop   - Stop Docker container"
	@echo "  docker-clean  - Remove Docker image"
	@echo "  docker-push   - Push Docker image to registry"
	@echo "  help          - Show this help message"

build:
	@echo "Building the project..."
	@npm run build

run:
	@echo "Running the project..."
	@npm run dev

clean:
	@echo "Cleaning the project..."
	@rm -rf node_modules
	@rm -rf dist
	@rm -rf .next
	@rm -rf .cache
	@rm -rf .vercel
	@rm -rf .vercel_cache
	@rm -rf .vercel_output
	@rm -rf .vercel_static

# Docker commands
docker-build:
	@echo "Building Docker image: $(DOCKER_IMAGE):$(DOCKER_TAG)"
	docker build -t $(DOCKER_IMAGE):$(DOCKER_TAG) .

docker-run:
	@echo "Running Docker container: $(DOCKER_IMAGE):$(DOCKER_TAG)"
	docker run -d \
		--name $(APP_NAME) \
		-p 80:80 \
		$(DOCKER_IMAGE):$(DOCKER_TAG)

docker-stop:
	@echo "Stopping Docker container: $(APP_NAME)"
	docker stop $(APP_NAME) || true
	docker rm $(APP_NAME) || true

docker-clean: docker-stop
	@echo "Removing Docker image: $(DOCKER_IMAGE):$(DOCKER_TAG)"
	docker rmi $(DOCKER_IMAGE):$(DOCKER_TAG) || true

docker-push:
	@if [ -z "$(DOCKER_REGISTRY)" ]; then \
		echo "Error: DOCKER_REGISTRY is not set"; \
		exit 1; \
	fi
	@echo "Tagging image for registry: $(DOCKER_REGISTRY)/$(DOCKER_IMAGE):$(DOCKER_TAG)"
	docker tag $(DOCKER_IMAGE):$(DOCKER_TAG) $(DOCKER_REGISTRY)/$(DOCKER_IMAGE):$(DOCKER_TAG)
	@echo "Pushing to registry: $(DOCKER_REGISTRY)/$(DOCKER_IMAGE):$(DOCKER_TAG)"
	docker push $(DOCKER_REGISTRY)/$(DOCKER_IMAGE):$(DOCKER_TAG)

docker-logs:
	docker logs -f $(APP_NAME)