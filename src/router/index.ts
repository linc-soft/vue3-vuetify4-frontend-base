/**
 * router/index.ts
 *
 * Manual routes for ./src/pages/*.vue
 */

import { createRouter, createWebHistory } from 'vue-router'
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
      path: '/',
      name: 'home',
      component: Index,
    },
  ],
})

// Navigation guard: Redirect to the login page when not logged in.
router.beforeEach(async to => {
  const { useAuthStore } = await import('@/stores/auth')
  const authStore = useAuthStore()

  if (!to.meta.guest && !authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guest && authStore.isAuthenticated) {
    return { name: 'home' }
  }
})

export default router
