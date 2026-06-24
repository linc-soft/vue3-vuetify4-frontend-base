# AGENTS.md — vue3-vuetify4-frontend-base

Admin SPA scaffolded from Vuetify CLI: master data, log monitoring, auth flows. Companion backend lives in `sping-boot4-backend-base` (note typo).

## Cross-project setup

- `opencode.json` grants edit access to `D:/Projects/github/sping-boot4-backend-base/**` and loads its `AGENTS.md` as merged instructions.
- The path must match the literal directory name `sping-boot4-backend-base`.

## Commands

Use **pnpm** (`packageManager: pnpm@11.7.0` in `package.json`); the README mentions npm but pnpm is the executable source of truth.

| Command             | Purpose                                     |
| ------------------- | ------------------------------------------- |
| `pnpm dev`          | Dev server on port 3000                     |
| `pnpm build`        | `run-p type-check "build-only {@}" --`      |
| `pnpm build-only`   | Production build (`vite build`)             |
| `pnpm type-check`   | `vue-tsc --build --force`                   |
| `pnpm lint`         | ESLint flat config                          |
| `pnpm lint:fix`     | ESLint auto-fix                             |
| `pnpm format`       | Prettier write (respects `.prettierignore`) |
| `pnpm format:check` | Prettier check                              |
| `pnpm mcp`          | Apply Vuetify MCP config via `ruler`        |
| `pnpm mcp:revert`   | Revert MCP config                           |

**Validation**: `pnpm lint:fix && pnpm format && pnpm build`

## Stack & conventions

- Vue 3 Composition API (`<script lang="ts" setup>`), Vite 8, TypeScript ~5.9.
- Vuetify 4 with `vite-plugin-vuetify` auto-import — never manually import Vuetify components in `.vue` files.
- Vue Router 5, hand-written routes in `src/router/index.ts`.
- Pinia 3 + `pinia-plugin-persistedstate`. Auth store key is `'auth'` in `localStorage`; `handleUnauthorized` clears it directly on 401.
- Vue I18n 11 (`legacy: false`). Locales `en`, `zh`, `ja`; Vuetify map `zh -> zhHans`.
- Zod v4 — always `import { z } from 'zod/v4'`.
- ESLint v10 flat config extending `eslint-config-vuetify` + Prettier plugin.
- Prettier: no semicolons, single quotes, trailing commas, `printWidth: 100`, `arrowParens: avoid`, `singleAttributePerLine: true`, `endOfLine: lf`.
- `@/` alias maps to `src/` (Vite + TS); use it in `<script>` imports.
- `.ruler/` is in `.prettierignore`.
- No test framework — do not add tests unless asked.

## Architecture

Entry: `src/main.ts` → `registerPlugins` (Vuetify, Pinia, i18n, Router) → mounts `#app`. `v-perm` directive is registered globally in `main.ts`.

```
src/
api/client.ts        Axios: CSRF, JWT in-memory, refresh via HttpOnly cookie, Accept-Language
api/types.ts         Result<T>, Page<T>
api/schemas/         Zod v4 schemas (one per module)
api/modules/         API call functions (mirror schemas/)
router/index.ts      Manual routes + beforeEach auth/permission guard
layouts/             BaselineLayout / SystemBarLayout selected by VITE_LAYOUT
pages/               Route-level components
components/          AppBar, NavigationDrawer, ChangePasswordDialog, DatetimeRangePicker, leave/*
composables/         useLocale, useEnums, useSelectOptions, useUserStatus, useCommonStatus
directives/perm.ts   v-perm directive (registered globally in main.ts)
stores/              auth (persisted), permission, app
locales/             en.ts, zh.ts, ja.ts
styles/settings.scss Vuetify SASS config file referenced in vite.config.mts
```

## Key patterns

- **API layer**: every module has `schemas/<module>.ts` + `modules/<module>.ts`; responses parsed through Zod; interceptor rejects `code !== 200`.
- **Auth**: JWT access token in-memory only; refresh via `/api/auth/refresh` with CSRF header; `csrfToken` cookie + `X-CSRF-Token` header.
- **Route guard**: unauthenticated → `/login?redirect=<path>`; authenticated on guest routes → home; `requirePasswordChange` → `/force-change-password`; route `resourceCode` checked against permission store.
- **Permissions**: `usePermissionStore` fetches resource tree; `ADMIN` role bypasses all checks; `v-perm="'code'"` removes elements without permission.
- **Layouts**: `resolveLayout()` reads `VITE_LAYOUT` env (`baseline` default, `system-bar` alternative).
- **i18n**: `useLocale()` syncs vue-i18n, Vuetify locale, `<html lang>`, and `localStorage`. Initial locale: `localStorage` → `VITE_DEFAULT_LOCALE` → first of `ENABLED_LOCALES`. `ENABLED_LOCALES` is parsed once from `VITE_ENABLED_LOCALES` (comma-separated subset of `en,zh,ja`; empty/invalid → all). Stored or default locales not in `ENABLED_LOCALES` are silently rejected. Language switcher dropdowns (`AppBar`, `login`, `forgot-password`, `reset-password`, `force-change-password`) and the resource-edit translation preview both consume `ENABLED_LOCALES`; `canSwitch` hides the dropdown when only one locale is enabled.
- **Enums/SelectOptions**: `useEnums(type)` / `useSelectOptions(type)` are lazy-loaded, module-level cached; `clearEnumsCache()` / `clearSelectOptionsCache()` called on logout.
- **Dev proxy**: `/api` → `http://localhost:8080`, `Origin` rewritten to backend to avoid CORS.

## Env

`.env.development`:

```env
VITE_API_BASE_URL=/
VITE_DEFAULT_LOCALE=en   # en | zh | ja
VITE_ENABLED_LOCALES=en,zh,ja  # comma-separated subset of en,zh,ja; empty = all
VITE_LAYOUT=baseline     # baseline | system-bar
```

## Hooks

Husky pre-commit runs `pnpm exec lint-staged`, which runs `eslint --fix` on `*.{ts,vue,js,mts}` and `prettier --write` on `*.{ts,vue,js,mts,json,scss,css,md,html}`.
