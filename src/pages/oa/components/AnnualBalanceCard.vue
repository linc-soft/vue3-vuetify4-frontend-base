<template>
  <v-card variant="outlined">
    <v-card-title class="d-flex align-center">
      <v-icon
        class="mr-2"
        icon="mdi-calendar-check-outline"
      />
      {{ t('leave.balance.title') }}
      <v-spacer />
      <v-btn
        density="comfortable"
        icon="mdi-refresh"
        :loading="loading"
        size="small"
        variant="text"
        @click="fetchBalance"
      />
    </v-card-title>
    <v-card-text>
      <div
        v-if="loading"
        class="d-flex justify-center py-4"
      >
        <v-progress-circular indeterminate />
      </div>
      <template v-else-if="balance">
        <div class="d-flex align-baseline mb-3">
          <span class="text-h4 text-primary mr-2">{{ balance.totalAvailable ?? 0 }}</span>
          <span class="text-medium-emphasis">{{ t('leave.balance.daysAvailable') }}</span>
        </div>
        <div
          v-if="balance.batches.length === 0"
          class="text-medium-emphasis"
        >
          {{ t('leave.balance.noBatches') }}
        </div>
        <v-table
          v-else
          density="compact"
        >
          <thead>
            <tr>
              <th>{{ t('leave.balance.grantDate') }}</th>
              <th>{{ t('leave.balance.expireDate') }}</th>
              <th class="text-right">{{ t('leave.balance.granted') }}</th>
              <th class="text-right">{{ t('leave.balance.used') }}</th>
              <th class="text-right">{{ t('leave.balance.remaining') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(batch, index) in balance.batches"
              :key="index"
            >
              <td>{{ batch.grantDate ?? '-' }}</td>
              <td>{{ batch.expireDate ?? '-' }}</td>
              <td class="text-right">{{ batch.grantedDays ?? 0 }}</td>
              <td class="text-right">{{ batch.usedDays ?? 0 }}</td>
              <td class="text-right font-weight-medium">{{ batch.remainingDays ?? 0 }}</td>
            </tr>
          </tbody>
        </v-table>
      </template>
      <v-alert
        v-if="errorMessage"
        class="mt-3"
        closable
        density="compact"
        type="error"
        variant="tonal"
        @click:close="errorMessage = ''"
      >
        {{ errorMessage }}
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import type { AnnualBalanceResponse } from '@/api/schemas/leave'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { getMyAnnualBalance } from '@/api/modules/leave'

const { t } = useI18n()

const balance = ref<AnnualBalanceResponse | null>(null)
const loading = ref(false)
const errorMessage = ref('')

async function fetchBalance() {
  loading.value = true
  errorMessage.value = ''
  try {
    balance.value = await getMyAnnualBalance()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : t('leave.error.loadFailed')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchBalance()
})

defineExpose({ fetchBalance })
</script>
