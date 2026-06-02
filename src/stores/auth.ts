import type { LoginRequest } from '@/api/schemas/auth'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getAccessToken, setAccessToken, tryRefreshToken } from '@/api/client'
import { login as apiLogin, logout as apiLogout } from '@/api/modules/auth'
import { clearSelectOptionsCache } from '@/composables/useSelectOptions'

export const useAuthStore = defineStore(
  'auth',
  () => {
    const username = ref<string | null>(null)
    const isAuthenticated = ref(false)
    const requirePasswordChange = ref(false)

    async function login(params: LoginRequest) {
      const res = await apiLogin(params)
      if (res.accessToken) {
        username.value = params.username
        isAuthenticated.value = true
        requirePasswordChange.value = res.requirePasswordChange ?? false
      }
      return res
    }

    async function logout() {
      try {
        await apiLogout()
      } catch {
        // Ignore API errors — clear local state regardless
      }
      setAccessToken(null)
      username.value = null
      isAuthenticated.value = false
      requirePasswordChange.value = false
      clearSelectOptionsCache()
    }

    function checkAuth() {
      isAuthenticated.value = !!getAccessToken()
    }

    async function validateAuth() {
      if (getAccessToken()) {
        isAuthenticated.value = true
        return
      }

      if (!isAuthenticated.value) {
        return
      }

      const refreshed = await tryRefreshToken()
      if (refreshed) {
        if (requirePasswordChange.value) {
          await logout()
        } else {
          isAuthenticated.value = true
        }
      } else {
        isAuthenticated.value = false
        requirePasswordChange.value = false
        username.value = null
      }
    }

    return {
      username,
      isAuthenticated,
      requirePasswordChange,
      login,
      logout,
      checkAuth,
      validateAuth,
    }
  },
  { persist: true },
)
