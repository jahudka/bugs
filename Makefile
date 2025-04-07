# The application entrypoint
entrypoint := src/bugs.ts

# The file name of the generated binary
binary := bugs

.PHONY: default
default: check

.PHONY: clean
clean:
	rm -f proxy2

node_modules:
	bun install --frozen-lockfile

.PHONY: dicc
dicc:
	bun x dicc

.PHONY: lint
lint: node_modules
	bun x eslint .

.PHONY: style
style: node_modules
	bun x prettier --check .

.PHONY: cs
cs: lint style

.PHONY: fixlint
fixlint: node_modules
	bun x eslint --fix .

.PHONY: fixstyle
fixstyle: node_modules
	bun x prettier --write .

.PHONY: pretty
pretty: fixlint fixstyle

.PHONY: check
check: node_modules
	bun x tsc

.PHONY: dev
dev:
	bun run src/proxy2.ts daemon:run

.PHONY: build
build: clean node_modules
	bun build src/proxy2.ts --compile --minify --sourcemap --target=bun-linux-x64 --outfile proxy2

.PHONY: release
release: build
	@if test -z "$(CI)"; then echo "You should only run this in CI"; exit 1; fi
	find . -mindepth 1 -maxdepth 1 -not -name proxy2 -exec rm -rf '{}' \;
