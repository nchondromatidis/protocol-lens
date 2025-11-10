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

augment-artifacts:
	@echo "Augmenting contract artifacts..."
	pnpm exec tsx tasks/augment-artifacts/augment-artifacts.ts

types-barrel:
	@echo "Generating type barrel exports..."
	pnpm exec ctix build

build: clean hardhat-tasks-filter-contracts hardhat-build list-protocols-contracts index-function-definitions augment-artifacts types-barrel
	@echo "Build complete!"
