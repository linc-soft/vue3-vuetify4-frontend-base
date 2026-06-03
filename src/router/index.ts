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
        { path: '', name: 'home', component: Index },
        { path: 'users', name: 'users', component: () => import('@/pages/master/users.vue') },
        { path: 'roles', name: 'roles', component: () => import('@/pages/master/roles.vue') },
        {
          path: 'employees',
          name: 'employees',
          component: () => import('@/pages/employee/index.vue'),
        },
        // Leave
        {
          path: 'leaves/apply',
          name: 'leave-apply',
          component: () => import('@/pages/leave/Apply.vue'),
        },
        {
          path: 'leaves/list',
          name: 'leave-list',
          component: () => import('@/pages/leave/List.vue'),
        },
        {
          path: 'leaves/approval',
          name: 'leave-approval',
          component: () => import('@/pages/leave/Approval.vue'),
        },
        // Regulations
        {
          path: 'regulations',
          name: 'regulations',
          component: () => import('@/pages/regulations/index.vue'),
        },
        // Logs
        { path: 'logs', name: 'logs-access', component: () => import('@/pages/logs/access.vue') },
        {
          path: 'logs/error',
          name: 'logs-error',
          component: () => import('@/pages/logs/error.vue'),
        },
        {
          path: 'logs/operation',
          name: 'logs-operation',
          component: () => import('@/pages/logs/operation.vue'),
        },
        {
          path: 'logs/trace/:traceId',
          name: 'logs-trace',
          component: () => import('@/pages/logs/trace.vue'),
        },
      ],
    },
  ],
})

// Navigation guard: Redirect to the login page when not logged in.
// Force password change redirect for INACTIVE users.
router.beforeEach(async to => {
  const { useAuthStore } = await import('@/stores/auth')
  const authStore = useAuthStore()

  // Synchronize in-memory token state with the persisted auth store before
  // evaluating guards. This prevents bypassing login after browser restart
  // when the access token is lost but isAuthenticated still appears true
  // from localStorage.
  await authStore.validateAuth()

  if (!to.meta.guest && !authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guest && authStore.isAuthenticated) {
    return { name: 'home' }
  }

  // INACTIVE users must change password before accessing other pages
  if (
    authStore.requirePasswordChange &&
    to.name !== 'force-change-password' &&
    to.name !== 'logout'
  ) {
    return { name: 'force-change-password' }
  }
})

export default router
