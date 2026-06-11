# AGENTS.md — vue3-vuetify4-frontend-base

An admin SPA scaffolded from Vuetify CLI: master data (users, roles, dept, position), log monitoring (access, error, operation, SQL, trace), auth flows, and file export.

## First Reads

- **`opencode.json`** — grants cross-project edit access to `D:/Projects/github/sping-boot4-backend-base/` and loads its `AGENTS.md` as merged instructions.
- **Backend repo**: `sping-boot4-backend-base` (note typo: `sping`, not `spring`). The path used in opencode.json must match the actual directory name.

## Commands

| Command             | Purpose                                      |
| ------------------- | -------------------------------------------- |
| `pnpm dev`          | Dev server on **port 3000**                  |
| `pnpm build`        | type-check + production build (`vite build`) |
| `pnpm type-check`   | `vue-tsc --build --force`                    |
| `pnpm lint`         | ESLint check (flat config, v10)              |
| `pnpm lint:fix`     | ESLint auto-fix                              |
| `pnpm format`       | Prettier write (entire project)              |
| `pnpm format:check` | Prettier check                               |
| `pnpm mcp`          | Apply Vuetify MCP config via `ruler`         |
| `pnpm mcp:revert`   | Revert MCP config                            |

**Validation order**: `pnpm lint:fix && pnpm format && pnpm type-check && pnpm build`

## Stack & Quirks

- **Vue 3** (Composition API, `<script lang="ts" setup>`) + **Vite 8** + **TypeScript ~5.9**
- **Vuetify 4** with `vite-plugin-vuetify` auto-import — never manually import Vuetify components in `.vue` files.
- **Vue Router 5** — routes hand-written in `src/router/index.ts`. Root path uses `resolveLayout()` to dynamically pick the layout.
- **Pinia 3** + `pinia-plugin-persistedstate`. Auth store key is `'auth'` in localStorage. On 401, `handleUnauthorized` clears this key directly.
- **Vue I18n 11** — `legacy: false`, Composition API. 3 locales: `en`, `zh`, `ja`. Vuetify locale map: `zh` → `zhHans`.
- **Zod v4** — import from `'zod/v4'` (not `'zod'`).
- **ESLint v10** flat config — extends `eslint-config-vuetify` with Prettier plugin.
- **Prettier**: no semicolons, single quotes, trailing commas, `printWidth: 100`, `arrowParens: "avoid"`, `singleAttributePerLine: true`.
- **`@` alias** → `src/` (both vite.config.mts and tsconfig.app.json). Use `@/` in `<script>` imports.
- **`.ruler/`** excluded from Prettier.
- **No test framework** (no vitest, no test scripts). Do not add tests unless asked.
- **VSCode**: recommended extensions `vuetify.vuetify-vscode` + `vue.volar`.

## Architecture

```
src/
├── main.ts              # createApp → registerPlugins → mount
├── App.vue              # <v-app><router-view/></v-app>
├── api/
│   ├── client.ts        # Axios (CSRF, JWT, token refresh, Accept-Language)
│   ├── types.ts         # Result<T>, Page<T> — backend envelope types
│   ├── schemas/         # Zod v4 schemas (one file per module)
│   └── modules/         # API call functions (mirrors schemas/)
├── plugins/             # Vuetify → Pinia → i18n → Router registration
├── router/index.ts      # Manual routes + beforeEach auth guard
├── stores/              # auth.ts (persisted), app.ts (empty skeleton)
├── pages/               # Route-level page components
├── layouts/             # BaselineLayout / SystemBarLayout (select via VITE_LAYOUT)
├── components/          # AppBar, NavigationDrawer, ChangePasswordDialog,
│                        # DatetimeRangePicker, leave/*
├── composables/         # useLocale, useEnums, useSelectOptions, useUserStatus, useCommonStatus
├── locales/             # en.ts, zh.ts, ja.ts
├── styles/              # Global SCSS + Vuetify SASS variable overrides
└── types/               # Manual ambient type declarations (spark-md5.d.ts)
```

### Key Patterns

- **API layer**: Every module has `schemas/<module>.ts` (Zod schemas) + `modules/<module>.ts` (Axios calls). Response data is parsed through Zod before returning. The Axios interceptor rejects responses where `code !== 200`.
- **Auth**: JWT access token in-memory only. Refresh via HttpOnly cookie. CSRF uses `csrfToken` cookie + `X-CSRF-Token` header. The `useLocale` composable's `LOCALE_STORAGE_KEY` and `SUPPORTED_LOCALES` are imported by `client.ts` for `Accept-Language`.
- **Route guard**: Redirects unauthenticated users to `/login?redirect=<path>`. Authenticated users visiting guest routes go home. `INACTIVE` users are redirected to `/force-change-password`.
- **Enums/SelectOptions**: `useEnums(type)` / `useSelectOptions(type)` are lazy-loaded composables that fetch from backend and cache module-level. `clearSelectOptionsCache()` is called on logout.
- **Layouts**: Resolved dynamically at route root via `resolveLayout()` reading `VITE_LAYOUT` env var. Available: `baseline` (default) / `system-bar`.
- **i18n**: `useLocale()` composable syncs vue-i18n, Vuetify locale, `<html lang>`, and `localStorage`. Initial resolution: `localStorage` → `VITE_DEFAULT_LOCALE` → `'en'`.
- **Dev proxy**: `/api` → `http://localhost:8080` with `Origin` rewritten to backend address.

### Notable Components

- `DatetimeRangePicker` — shared date range picker used across log pages.
- `ChangePasswordDialog` — reusable password change dialog.
- `leave/` — leave-management related components.

## Hooks

- **Husky pre-commit**: `pnpm exec lint-staged` — runs `eslint --fix` then `prettier --write` on staged `.ts/.vue/.js/.mts/.json/.scss/.css/.md/.html` files.

## Env

File: `.env.development`

```env
VITE_API_BASE_URL=/
VITE_DEFAULT_LOCALE=en   # en | zh | ja (NOT jp)
VITE_LAYOUT=baseline     # baseline | system-bar
```

The comment in `.env.development` says `jp` but the correct value is `ja`. `SUPPORTED_LOCALES` in `useLocale.ts` is the authoritative source.

## Cross-Project

- `opencode.json` gives this agent access to the backend repo at `D:/Projects/github/sping-boot4-backend-base/` and merges its `AGENTS.md` instructions. Use both when working on full-stack features.
