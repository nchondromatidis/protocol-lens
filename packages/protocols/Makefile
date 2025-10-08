# Makefile for @defi-notes/protocols

.PHONY: check-types contracts-clear hardhat-clear clear hardhat-build types-barrel \
        hardhat-tasks-source-maps hardhat-tasks-filter-contracts build map-protocols-contracts

# Check TypeScript types without emitting files
check-types:
	@echo "Checking TypeScript types..."
	tsc --noEmit

contracts-clear:
	@echo "Clearing contracts directory..."
	rm -rf contracts/*


hardhat-clear:
	@echo "Cleaning Hardhat..."
	hardhat clean

clear: hardhat-clear contracts-clear
	@echo "All cleared!"

hardhat-build:
	@echo "Building with Hardhat..."
	hardhat build

types-barrel:
	@echo "Generating type barrel exports..."
	ctix build

hardhat-tasks-source-maps:
	@echo "Injecting source maps..."
	tsx tasks/inject-sourcemaps.ts

hardhat-tasks-filter-contracts:
	@echo "Filtering contracts..."
	tsx tasks/filter-contracts.ts

map-protocols-contracts:
	@echo "Mapping Contracts..."
	tsx tasks/map-protocols-contracts.ts
	npx quicktype --src ./artifacts/protocols-contracts-map.json --src-lang json --out ./artifacts/protocols-contracts-map.d.ts --just-types


# Full build pipeline
build: clear hardhat-tasks-filter-contracts hardhat-build hardhat-tasks-source-maps types-barrel map-protocols-contracts
	@echo "Build complete!"
