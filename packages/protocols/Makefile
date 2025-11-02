# Makefile for @defi-notes/protocols

check-types:
	@echo "Checking TypeScript types..."
	tsc --noEmit

contracts-clean:
	@echo "cleaning contracts directory..."
	rm -rf contracts/*

hardhat-clean:
	@echo "Cleaning Hardhat..."
	pnpm exec hardhat clean

clean: hardhat-clean contracts-clean
	@echo "All cleaned!"

hardhat-tasks-filter-contracts:
	@echo "Filtering contracts..."
	pnpm exec tsx tasks/filter-contracts.ts

hardhat-build:
	@echo "Building with Hardhat..."
	pnpm exec hardhat build

list-protocols-contracts:
	@echo "Mapping Contracts..."
	pnpm exec tsx tasks/list-protocols-contracts.ts

index-function-definitions:
	@echo "Indexing function definition..."
	pnpm exec tsx tasks/index-function-definitions.ts

types-barrel:
	@echo "Generating type barrel exports..."
	pnpm exec ctix build


# Full build pipeline
add-storage-layout:
	@echo "Adding storageLayout to contract artifacts..."
	pnpm exec tsx tasks/add-storage-layout.ts

build: clean hardhat-tasks-filter-contracts hardhat-build list-protocols-contracts index-function-definitions add-storage-layout types-barrel
	@echo "Build complete!"
