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

list-contracts-per-protocol:
	@echo "Mapping Contracts to protocols..."
	pnpm exec hardhat list-contracts-per-protocol

index-functions:
	@echo "Indexing functions..."
	pnpm exec hardhat index-functions

augment-artifacts:
	@echo "Augmenting contract artifacts..."
	pnpm exec hardhat augment-artifacts

list-protocols:
	@echo "Listing protocols..."
	pnpm exec hardhat list-protocols

type-barrel:
	@echo "Generating type barrel exports..."
	pnpm exec hardhat type-barrel

build: clean hardhat-tasks-filter-contracts hardhat-build list-contracts-per-protocol index-functions augment-artifacts list-protocols type-barrel
	@echo "Build complete!"
