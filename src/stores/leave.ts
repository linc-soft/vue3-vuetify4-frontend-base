import type { LeaveInfoResponse } from '@/api/schemas/leave'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getAnnualRemain, getLeaveInfo } from '@/api/modules/leave'

export const useLeaveStore = defineStore(
  'leave',
  () => {
    const leaveInfo = ref<LeaveInfoResponse | null>(null)
    const annualRemain = ref<number | null>(null)

    async function fetchLeaveInfo() {
      leaveInfo.value = await getLeaveInfo()
    }

    async function fetchAnnualRemain(date: string) {
      const res = await getAnnualRemain(date)
      annualRemain.value = res.remainDays
    }

    function clearLeaveData() {
      leaveInfo.value = null
      annualRemain.value = null
    }

    return { leaveInfo, annualRemain, fetchLeaveInfo, fetchAnnualRemain, clearLeaveData }
  },
  { persist: true },
)
