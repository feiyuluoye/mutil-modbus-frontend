all:
	@echo "Usage: make <target>"
	@echo "Targets:"
	@echo "  build    - Build the project"
	@echo "  run      - Run the project"
	@echo "  clean    - Clean the project"
	@echo "  help     - Show this help message"
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