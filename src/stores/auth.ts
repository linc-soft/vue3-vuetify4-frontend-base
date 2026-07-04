import type { LoginRequest, ProfileResponse, ProfileUpdateRequest } from '@/api/schemas/auth'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getAccessToken, setAccessToken, tryRefreshToken } from '@/api/client'
import {
  login as apiLogin,
  logout as apiLogout,
  getProfile,
  updateProfile,
} from '@/api/modules/auth'
import { clearEnumsCache } from '@/composables/useEnums'
import { clearSelectOptionsCache } from '@/composables/useSelectOptions'
import { usePermissionStore } from '@/stores/permission'

export const useAuthStore = defineStore(
  'auth',
  () => {
    const username = ref<string | null>(null)
    const isAuthenticated = ref(false)
    const requirePasswordChange = ref(false)
    const profile = ref<ProfileResponse | null>(null)

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
      profile.value = null
      clearSelectOptionsCache()
      clearEnumsCache()
      usePermissionStore().clear()
    }

    async function fetchProfile() {
      profile.value = await getProfile()
      return profile.value
    }

    async function updateMyProfile(params: ProfileUpdateRequest) {
      profile.value = await updateProfile(params)
      return profile.value
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
        usePermissionStore().clear()
      }
    }

    return {
      username,
      isAuthenticated,
      requirePasswordChange,
      profile,
      login,
      logout,
      fetchProfile,
      updateMyProfile,
      checkAuth,
      validateAuth,
    }
  },
  { persist: true },
)
