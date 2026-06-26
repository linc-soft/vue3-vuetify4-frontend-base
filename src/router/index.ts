/**
 * router/index.ts
 *
 * Manual routes for ./src/pages/*.vue
 */

import { createRouter, createWebHistory } from 'vue-router'
import { resolveLayout } from '@/layouts/resolveLayout'
import Index from '@/pages/index.vue'
import Login from '@/pages/login.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: { guest: true },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/pages/forgot-password.vue'),
      meta: { guest: true },
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('@/pages/reset-password.vue'),
      meta: { guest: true },
    },
    {
      path: '/force-change-password',
      name: 'force-change-password',
      component: () => import('@/pages/force-change-password.vue'),
    },
    {
      path: '/',
      component: resolveLayout(),
      children: [
        { path: '', name: 'home', component: Index, meta: { resourceCode: 'home' } },
        {
          path: 'master/users',
          name: 'users',
          component: () => import('@/pages/master/users.vue'),
          meta: { resourceCode: 'user:read' },
        },
        {
          path: 'master/roles',
          name: 'roles',
          component: () => import('@/pages/master/roles.vue'),
          meta: { resourceCode: 'role:read' },
        },
        {
          path: 'master/departments',
          name: 'departments',
          component: () => import('@/pages/master/departments.vue'),
          meta: { resourceCode: 'dept:read' },
        },
        {
          path: 'master/positions',
          name: 'positions',
          component: () => import('@/pages/master/positions.vue'),
          meta: { resourceCode: 'position:read' },
        },
        {
          path: 'master/resources',
          name: 'resources',
          component: () => import('@/pages/master/resources.vue'),
          meta: { resourceCode: 'resource:read' },
        },
        // Logs
        {
          path: 'logs',
          name: 'logs-access',
          component: () => import('@/pages/logs/access.vue'),
          meta: { resourceCode: 'log:access:read' },
        },
        {
          path: 'logs/error',
          name: 'logs-error',
          component: () => import('@/pages/logs/error.vue'),
          meta: { resourceCode: 'log:error:read' },
        },
        {
          path: 'logs/operation',
          name: 'logs-operation',
          component: () => import('@/pages/logs/operation.vue'),
          meta: { resourceCode: 'log:operation:read' },
        },
        {
          path: 'logs/trace/:traceId',
          name: 'logs-trace',
          component: () => import('@/pages/logs/trace.vue'),
          meta: { resourceCode: 'log:trace:read' },
        },
        {
          path: 'logs/sql',
          name: 'logs-sql',
          component: () => import('@/pages/logs/sql.vue'),
          meta: { resourceCode: 'log:sql:read' },
        },
        {
          path: '403',
          name: 'forbidden',
          component: () => import('@/pages/forbidden.vue'),
        },
      ],
    },
  ],
})

router.beforeEach(async to => {
  const { useAuthStore } = await import('@/stores/auth')
  const { usePermissionStore } = await import('@/stores/permission')
  const authStore = useAuthStore()
  const permStore = usePermissionStore()

  await authStore.validateAuth()

  if (!to.meta.guest && !authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guest && authStore.isAuthenticated) {
    return { name: 'home' }
  }

  if (
    authStore.requirePasswordChange &&
    to.name !== 'force-change-password' &&
    to.name !== 'logout'
  ) {
    return { name: 'force-change-password' }
  }

  if (authStore.isAuthenticated && !to.meta.guest && to.name !== 'force-change-password') {
    if (!permStore.loaded) {
      try {
        await permStore.load()
      } catch {
        // Failure to load permissions should not block navigation; backend 403 will catch.
      }
    }
    const code = to.meta.resourceCode as string | undefined
    if (code && !permStore.isRouteAllowed(code) && to.name !== 'forbidden') {
      return { name: 'forbidden' }
    }
  }
})

export default router
