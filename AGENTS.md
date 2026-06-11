# Project Rules

## General

- Follow the existing code style and patterns.
- Use **pnpm** (not npm/yarn) — `packageManager` is pinned to `pnpm@10.12.1`.
- Keep code in TypeScript. Use `<script lang="ts" setup>` in `.vue` files.
- Named imports must be in **natural ascending order** (e.g. `import { alpha, beta, gamma }`).

## Stack

- **Vue 3** (Composition API) + **Vite 8** + **TypeScript ~5.9**
- **Vuetify 4** with auto-import enabled (`vite-plugin-vuetify`). Do **not** manually import Vuetify components.
- **Vue Router 5** with hand-written routes in `src/router/index.ts`.
- **Pinia 3** with `pinia-plugin-persistedstate`.
- **Vue I18n 11** (`legacy: false`, Composition API mode).
- **Zod v4** for runtime API response validation — import from `'zod/v4'` (not `'zod'`).

## Commands

| Command             | Purpose                            |
| ------------------- | ---------------------------------- |
| `pnpm dev`          | Dev server (port **3000**)         |
| `pnpm build`        | type-check + production build      |
| `pnpm type-check`   | `vue-tsc --build --force`          |
| `pnpm lint`         | ESLint check                       |
| `pnpm lint:fix`     | ESLint auto-fix                    |
| `pnpm format`       | Prettier write                     |
| `pnpm format:check` | Prettier check                     |
| `pnpm mcp`          | Apply Vuetify MCP config via ruler |
| `pnpm mcp:revert`   | Revert MCP config                  |

Order when validating changes: `pnpm lint:fix && pnpm format && pnpm type-check && pnpm build`

## Code Style

- **Prettier**: no semicolons, single quotes, trailing commas, `printWidth: 100`, `arrowParens: "avoid"`, `vueIndentScriptAndStyle: false`.
- **lint-staged** runs `eslint --fix` then `prettier --write` on staged `.ts/.vue/.js/.mts` files.
- **ESLint**: extends `eslint-config-vuetify` with Prettier integration.

## Architecture

### Directory Map

```
src/
├── main.ts              # Entry: createApp → registerPlugins → mount
├── App.vue              # Root: <v-app> with <router-view>
├── api/
│   ├── client.ts        # Axios instance (CSRF, JWT interceptors, token refresh)
│   ├── types.ts         # Result<T>, Page<T> — backend envelope types
│   ├── schemas/         # Zod v4 schemas (one file per module)
│   └── modules/         # API call functions (one file per module, mirrors schemas/)
├── plugins/
│   ├── index.ts         # registerPlugins(app): Vuetify → Pinia → i18n → Router
│   ├── vuetify.ts       # Vuetify 4 config (theme + locale)
│   └── i18n.ts          # Vue I18n 11 config
├── router/index.ts      # Manual routes + beforeEach auth guard
├── stores/              # Pinia stores (per-module files)
├── pages/               # Route-level page components
├── layouts/             # Layout components; selected via VITE_LAYOUT env var
├── components/          # Shared reusable components
├── composables/         # Shared composables (useLocale, useEnums, useSelectOptions)
├── locales/             # i18n locale files (en.ts, zh.ts, ja.ts)
└── styles/              # Global styles + Vuetify SASS variables
```

### Key Design Decisions

- **Vuetify 4 auto-import**: Components (`<v-*>`) are auto-imported by `vite-plugin-vuetify`. Never manually import Vuetify components in `.vue` files.
- **`@` alias**: `@` → `src/` (configured in both `vite.config.mts` and `tsconfig.app.json`).
- **Path alias in `.vue` templates**: Use `@/` for imports in `<script>` but never in `<template>` (Vite handles resolution differently).
- **API layer**: Each module has a matched pair — `src/api/schemas/<module>.ts` (Zod types) and `src/api/modules/<module>.ts` (Axios calls). All API response data is parsed through Zod before returning.
- **API envelope**: Backend wraps everything in `Result<T>` (`{ code, message, data }`). The Axios interceptor rejects on `code !== 200`.
- **Result/Page types**: Defined in `src/api/types.ts`, not in Zod schemas.

### Auth Flow

- JWT access token is held **in-memory** (`setAccessToken`/`getAccessToken` in `client.ts`), attached via `Authorization: Bearer` header.
- Refresh token is an **HttpOnly cookie** set by the backend.
- CSRF: Cookie `csrfToken`, header `X-CSRF-Token` (Axios configured with `xsrfCookieName`/`xsrfHeaderName`).
- On 401: automatically attempts token refresh (`tryRefreshToken`), retries the original request. On refresh failure: clears auth state and redirects to `/login`.
- Route guard (`router.beforeEach`): redirects to `/login?redirect=<path>` if not authenticated; redirects to `/` if already authenticated and visiting guest routes.

### Layout System

- Configure via `VITE_LAYOUT` in `.env.development`: `baseline` (default, `BaselineLayout.vue`) or `system-bar` (`SystemBarLayout.vue`).
- Layouts wrap `<router-view>` inside `<v-main>` with `<AppBar>` + `<NavigationDrawer>`.

### i18n

- 3 supported locales: `en`, `zh`, `ja`.
- `useLocale()` composable keeps vue-i18n, Vuetify locale, `<html lang>`, and `localStorage` in sync.
- Initial locale resolution: `localStorage` → `VITE_DEFAULT_LOCALE` env → `'en'`.
- Vuetify locale keys differ from app keys: `zh` maps to `zhHans`.

### Enums & Select Options

- `useEnums(type)` and `useSelectOptions(type)` are lazy-loaded, cached composables that fetch data from backend endpoints and expose reactive `items`, `options` (for `v-select`), and `labelOf` helpers.
- Caches are cleared on logout via `clearSelectOptionsCache()`.

## Dev Server & Proxy

- Dev server runs on **port 3000**.
- `/api` requests are proxied to `http://localhost:8080` with `Origin` header rewritten to the backend address.

## Important Constraints

- **No test framework** is configured (no vitest, no test scripts). Do not add tests unless asked.
- **`.ruler/` directory** is excluded from Prettier formatting.
- **VSCode**: recommended extensions are `vuetify.vuetify-vscode` and `vue.volar` (not Vetur).
- **Husky pre-commit** runs `pnpm exec lint-staged` which lints and formats staged files.
- **Backend reference**: See `.kiro/settings/mcp.json` for the backend MCP server config pointing to the Java project.
