.PHONY: install build lint test dev clean tauri-dev tauri-build type-check

install:
	pnpm install

build:
	pnpm run build

lint:
	pnpm run lint

test:
	pnpm test

dev:
	pnpm run dev

tauri-dev:
	pnpm run tauri:dev

tauri-build:
	pnpm run tauri:build

type-check:
	pnpm run type-check

clean:
	rm -rf dist coverage node_modules
