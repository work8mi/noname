# AGENTS.md

无名杀 (noname): GPL-3.0 card game, pnpm monorepo. Chinese is the working language for code comments, docs, commit messages and PR text.

## Layout

- `apps/core` — the game. Its pnpm package name is `noname` (not `@noname/core`). Source in `noname/` (mixed JS/TS, typed via JSDoc + `typings/*.d.ts`); content packs in `character/`, `card/`, `mode/`; built-in runtime extensions in `extension/`.
- `packages/fs` — Fastify file API (port 8089) that the dev server proxies (`/readFile`, `/writeFile`, ...); also serves built output and builds standalone binaries.
- `packages/jit` — service-worker/Vite plugin that compiles TypeScript in the browser, which is why `.ts` content packs work in a built game.
- `packages/server` — multiplayer WebSocket server (port 8082).
- `apps/electron`, `apps/mobile` — desktop/mobile shells. `packages/extension/<name>` — extension dev workspace (gitignored except an allowlist); scaffolds come from `scripts/extension-template/`.
- `docs/` — Chinese dev references (event system, async skills, startup flow); copied to `dist/docs` by the build.

## Commands

- `pnpm install` — Node `^20.19.0 || >=22.12.0`, pnpm `>= 9` (CI uses Node 24 + pnpm 10). The workspace uses `sharedWorkspaceLockfile: false`: each package keeps its own `pnpm-lock.yaml`. Add deps with `pnpm --filter <pkg> add <dep>`; never hand-edit lockfiles.
- `pnpm dev` — three watchers: `@noname/fs` file API (8089), extension `build:watch`, and the core Vite dev server at `http://127.0.0.1:8081` (`docs/how-to-start.md` says 8080 — stale). The file API must be running or save/load features break.
- `pnpm lint` — recursive per-package ESLint, with narrow globs: `apps/core` lints only `noname/**`, so edits in `character/`, `card/`, `mode/`, `extension/` are not checked. Single package: `pnpm -F noname lint`.
- `pnpm build` — builds core and its workspace deps (`pnpm -F noname... build`), then extension packages, then merges `apps/core/dist` + audio/image/extension + docs into root `dist/`. Core only: `pnpm -F noname build`.
- `pnpm serve` / `pnpm start` — serve the built root `dist/` via `@noname/fs`.
- `pnpm -F noname generateAsset` — regenerate `apps/core/game/asset.json` after adding files under `audio/`, `image/`, `font/`, `theme/`; `generateTestPack` diffs against it to ship only new assets.
- `pnpm generateTestPack` — build + `output/testpack`.
- `pnpm init:extension <name> [--author x] [--vue]` — scaffold at `packages/extension/<name>`; its Vite build outputs to `apps/core/extension/<name>`.
- `pnpm -F @noname/server dev` — multiplayer server on 8082. `pnpm -F @noname/electron build:win|build:mac|build:linux` requires a prior `pnpm build` and writes to `./output`. `pnpm -F @noname/mobile build:android` needs Android SDK/JDK 21.
- `pnpm -F noname build:types` — emit `apps/core/dist-types/noname.d.ts`, the types extension packages consume.

## Verification

There is no test framework, test script, or test file in the repo. Verify with `pnpm lint` plus `pnpm -F noname build` (or `pnpm build`), then play the affected flow through `pnpm dev`. CI lints only packages changed against the base branch.

## Conventions that differ from defaults

- Tabs (width 4), LF, Prettier `printWidth: Infinity`; there is no `format` script — don't reformat unrelated code.
- Commit/PR titles must be Conventional Commits; allowed types are in `.github/commit-check.toml` (`build feat fix docs style refactor perf test chore ci revert`). Branch names are checked too (`feature bugfix hotfix release chore feat fix maint`). `feat` and `fix` must not share one PR (CONTRIBUTING.md).
- Import game globals as `import { lib, game, ui, get, ai, _status } from "noname"` (`noname` → `apps/core/noname.js`, `@` → `apps/core/noname`).
- Skills: new or rewritten `content` must be `Async Content` (`async content(event, trigger, player)`); never add `Step Content`. Pass object arguments to `Player` event methods that support them (`player.gain({ cards, source, animate })`); don't mix positional and object args. See `docs/async-guide.md`, `docs/lib-skill-format.md`, `docs/player-event-object-parameters.md`.
- Types come from JSDoc (`checkJs` is on): keep `@param`/`@returns` annotations when editing JS under `apps/core/noname`.

## Content and entrypoints

- Character packs are auto-discovered from directories in `apps/core/character/<pack>/`; each needs an `index.js`/`index.ts` exporting `type = "character"` plus the pack config. Dev imports `/character/<pack>/index`; the build emits one file per pack.
- Card packs are top-level files in `apps/core/card/`; modes live in `apps/core/mode/`. Loaders try `.js` then `.ts` (`apps/core/noname/init/import.ts`) and the module's `type` export must match.
- Built-in extensions shipped with the game live in `apps/core/extension/<name>`; extension development sources are gitignored in `packages/extension`.

## CI / release

- Push to `main`: `.github/workflows/build.yml` builds and force-pushes `dist` to the `build-output` branch — never edit that branch by hand.
- PRs: lint of changed packages plus conventional-commit check.
- Releases: numeric `v*` tags create a draft release with `apps/core/game/updateLog.md` as notes. `NONAME_BUILD_CHANNEL` / `NONAME_BUILD_COMMIT` / `NONAME_BUILD_TIME` are baked into `game/build-info.json`; nightlies run `pnpm generateTestPack`.
