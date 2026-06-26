import { defineStore } from 'pinia'
import { ref } from 'vue'

export type SnackbarColor = 'success' | 'error' | 'info' | 'warning'

export const useSnackbarStore = defineStore('snackbar', () => {
  const visible = ref(false)
  const message = ref('')
  const color = ref<SnackbarColor>('success')
  const timeout = ref(3000)

  function show(payload: { message: string; color?: SnackbarColor; timeout?: number }) {
    message.value = payload.message
    color.value = payload.color ?? 'success'
    timeout.value = payload.timeout ?? 3000
    visible.value = false
    requestAnimationFrame(() => {
      visible.value = true
    })
  }

  function success(msg: string, timeoutMs?: number) {
    show({ message: msg, color: 'success', timeout: timeoutMs })
  }

  function error(msg: string, timeoutMs?: number) {
    show({ message: msg, color: 'error', timeout: timeoutMs })
  }

  function info(msg: string, timeoutMs?: number) {
    show({ message: msg, color: 'info', timeout: timeoutMs })
  }

  function warning(msg: string, timeoutMs?: number) {
    show({ message: msg, color: 'warning', timeout: timeoutMs })
  }

  function close() {
    visible.value = false
  }

  return {
    visible,
    message,
    color,
    timeout,
    show,
    success,
    error,
    info,
    warning,
    close,
  }
})
