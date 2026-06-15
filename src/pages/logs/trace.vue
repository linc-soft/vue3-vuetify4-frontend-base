<template>
  <v-container fluid>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col>
        <div class="d-flex align-center">
          <div>
            <div class="text-h5">
              {{ t('log.trace.title') }}
            </div>
            <div class="text-body-2 text-medium-emphasis">
              Trace ID: {{ traceId }}
              <v-btn
                class="ml-2"
                :color="copiedTraceId ? 'success' : undefined"
                density="compact"
                :icon="copiedTraceId ? 'mdi-check' : 'mdi-content-copy'"
                size="small"
                variant="text"
                @click="copyTraceId"
              />
            </div>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Loading state -->
    <v-row v-if="loading">
      <v-col class="text-center">
        <v-progress-circular indeterminate />
      </v-col>
    </v-row>

    <!-- Error state -->
    <v-row v-else-if="error">
      <v-col>
        <v-alert type="error">
          {{ error }}
        </v-alert>
      </v-col>
    </v-row>

    <!-- Content -->
    <template v-else-if="traceDetail">
      <!-- Summary -->
      <v-row class="mb-4">
        <v-col>
          <v-card variant="outlined">
            <v-card-text class="d-flex ga-6">
              <div>
                <span class="text-medium-emphasis">{{ t('log.trace.totalDuration') }}:</span>
                <span class="ml-2 font-weight-bold">{{
                  traceDetail.accessLog ? `${traceDetail.accessLog.duration}ms` : '-'
                }}</span>
              </div>
              <div>
                <span class="text-medium-emphasis">{{ t('log.trace.operationCount') }}:</span>
                <span class="ml-2 font-weight-bold">{{ traceDetail.operationLogs.length }}</span>
              </div>
              <div>
                <span class="text-medium-emphasis">{{ t('log.trace.sqlCount') }}:</span>
                <span class="ml-2 font-weight-bold">{{ traceDetail.sqlLogs.length }}</span>
              </div>
              <div>
                <span class="text-medium-emphasis">{{ t('log.trace.errorCount') }}:</span>
                <span
                  class="ml-2 font-weight-bold"
                  :class="traceDetail.errorLog ? 'text-error' : ''"
                >
                  {{ traceDetail.errorLog ? 1 : 0 }}
                </span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Timeline -->
      <v-timeline
        align="start"
        density="compact"
        side="end"
      >
        <!-- Access Log -->
        <v-timeline-item
          dot-color="primary"
          icon="mdi-web"
          size="small"
        >
          <v-card
            v-if="traceDetail.accessLog"
            variant="outlined"
          >
            <v-card-title class="text-subtitle-1">
              {{ t('log.access.title') }}
            </v-card-title>
            <v-card-text>
              <v-row dense>
                <v-col cols="6">
                  <div class="text-medium-emphasis text-caption">
                    {{ t('log.access.method') }}
                  </div>
                  <div>{{ traceDetail.accessLog.method }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="text-medium-emphasis text-caption">
                    {{ t('log.access.path') }}
                  </div>
                  <div>{{ traceDetail.accessLog.path }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="text-medium-emphasis text-caption">
                    {{ t('log.access.statusCode') }}
                  </div>
                  <div>
                    <v-chip
                      :color="getStatusCodeColor(traceDetail.accessLog.statusCode)"
                      size="small"
                    >
                      {{ traceDetail.accessLog.statusCode }}
                    </v-chip>
                  </div>
                </v-col>
                <v-col cols="6">
                  <div class="text-medium-emphasis text-caption">
                    {{ t('log.access.duration') }}
                  </div>
                  <div>{{ traceDetail.accessLog.duration }}ms</div>
                </v-col>
                <v-col cols="6">
                  <div class="text-medium-emphasis text-caption">
                    {{ t('log.access.username') }}
                  </div>
                  <div>{{ traceDetail.accessLog.username || '-' }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="text-medium-emphasis text-caption">
                    {{ t('log.access.clientIp') }}
                  </div>
                  <div>{{ traceDetail.accessLog.clientIp || '-' }}</div>
                </v-col>
                <v-col cols="12">
                  <div class="text-medium-emphasis text-caption">
                    {{ t('log.common.createdAt') }}
                  </div>
                  <div>{{ formatDateTime(traceDetail.accessLog.createdAt) }}</div>
                </v-col>
              </v-row>

              <!-- Request Body -->
              <div
                v-if="traceDetail.accessLog.requestBody"
                class="mt-4"
              >
                <div class="text-subtitle-2 mb-2">
                  {{ t('log.access.requestBody') }}
                </div>
                <JsonViewer :data="traceDetail.accessLog.requestBody" />
              </div>

              <!-- Response Body -->
              <div
                v-if="traceDetail.accessLog.responseBody"
                class="mt-4"
              >
                <div class="text-subtitle-2 mb-2">
                  {{ t('log.access.responseBody') }}
                </div>
                <JsonViewer :data="traceDetail.accessLog.responseBody" />
              </div>
            </v-card-text>
          </v-card>
          <v-card
            v-else
            variant="outlined"
          >
            <v-card-text class="text-medium-emphasis">
              <v-icon class="mr-2">mdi-alert-outline</v-icon>
              {{ t('log.trace.noAccessLog') }}
            </v-card-text>
          </v-card>
        </v-timeline-item>

        <!-- Operation Logs -->
        <v-timeline-item
          v-if="traceDetail.operationLogs.length > 0"
          dot-color="info"
          icon="mdi-cog-outline"
          size="small"
        >
          <v-card variant="outlined">
            <v-card-title class="text-subtitle-1">
              {{ t('log.operation.title') }} ({{ traceDetail.operationLogs.length }})
            </v-card-title>
            <v-card-text>
              <v-expansion-panels variant="accordion">
                <v-expansion-panel
                  v-for="log in traceDetail.operationLogs"
                  :key="log.id"
                >
                  <v-expansion-panel-title>
                    <div class="d-flex align-center ga-2">
                      <v-chip
                        v-if="log.operationType"
                        :color="getOperationTypeColor(log.operationType)"
                        size="small"
                      >
                        {{ operationTypeLabelOf(log.operationType) }}
                      </v-chip>
                      <span>{{ log.module ? moduleLabelOf(log.module) : '-' }}</span>
                      <span
                        v-if="log.subModule"
                        class="text-medium-emphasis"
                        >/ {{ subModuleLabelOf(log.subModule) }}</span
                      >
                      <span class="text-medium-emphasis text-caption ml-2">
                        {{ formatTime(log.createdAt) }}
                      </span>
                    </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <div
                      v-if="log.description"
                      class="mb-2"
                    >
                      {{ log.description }}
                    </div>
                    <div
                      v-if="log.duration !== null"
                      class="mb-2 text-caption text-medium-emphasis"
                    >
                      {{ t('log.operation.duration') }}: {{ log.duration }}ms
                    </div>
                    <div
                      v-if="log.requestMethod || log.requestUrl"
                      class="mb-2 text-caption"
                    >
                      <span v-if="log.requestMethod">{{ log.requestMethod }}</span>
                      <span
                        v-if="log.requestUrl"
                        class="ml-1"
                        >{{ log.requestUrl }}</span
                      >
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-card-text>
          </v-card>
        </v-timeline-item>

        <!-- SQL Logs -->
        <v-timeline-item
          v-if="traceDetail.sqlLogs.length > 0"
          dot-color="secondary"
          icon="mdi-database-search-outline"
          size="small"
        >
          <v-card variant="outlined">
            <v-card-title class="text-subtitle-1">
              {{ t('log.sql.title') }} ({{ traceDetail.sqlLogs.length }})
            </v-card-title>
            <v-card-text>
              <v-expansion-panels variant="accordion">
                <v-expansion-panel
                  v-for="log in traceDetail.sqlLogs"
                  :key="log.id"
                >
                  <v-expansion-panel-title>
                    <div class="d-flex align-center ga-2 flex-wrap">
                      <v-chip
                        v-if="log.sqlType"
                        :color="getSqlTypeColor(log.sqlType)"
                        size="small"
                      >
                        {{ log.sqlType }}
                      </v-chip>
                      <span :class="getDurationColorClass(log.duration)">
                        {{ log.duration ?? '-' }}ms
                      </span>
                      <span class="text-medium-emphasis text-caption">
                        {{ formatTime(log.createTime ?? '') }}
                      </span>
                    </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-row dense>
                      <v-col
                        cols="12"
                        md="6"
                      >
                        <div class="text-medium-emphasis text-caption">
                          {{ t('log.sql.mapperClass') }}
                        </div>
                        <div class="text-body-2">{{ log.mapperClass || '-' }}</div>
                      </v-col>
                      <v-col
                        cols="12"
                        md="6"
                      >
                        <div class="text-medium-emphasis text-caption">
                          {{ t('log.sql.mapperMethod') }}
                        </div>
                        <div class="text-body-2">{{ log.mapperMethod || '-' }}</div>
                      </v-col>
                      <v-col
                        cols="12"
                        md="6"
                      >
                        <div class="text-medium-emphasis text-caption">
                          {{ t('log.sql.rowCount') }}
                        </div>
                        <div class="text-body-2">{{ log.rowCount ?? '-' }}</div>
                      </v-col>
                      <v-col
                        cols="12"
                        md="6"
                      >
                        <div class="text-medium-emphasis text-caption">
                          {{ t('log.common.username') }}
                        </div>
                        <div class="text-body-2">{{ log.username || '-' }}</div>
                      </v-col>
                    </v-row>

                    <div class="mt-4">
                      <div class="d-flex align-center justify-space-between mb-2">
                        <div class="text-subtitle-2">{{ t('log.sql.sqlText') }}</div>
                        <v-btn
                          :color="copiedSqlIds.has(log.id) ? 'success' : undefined"
                          density="compact"
                          :icon="copiedSqlIds.has(log.id) ? 'mdi-check' : 'mdi-content-copy'"
                          size="small"
                          variant="text"
                          @click="copySqlText(log.id, log.sqlText ?? '')"
                        />
                      </div>
                      <pre class="sql-text">{{ log.sqlText || '-' }}</pre>
                    </div>

                    <div
                      v-if="log.sqlParams"
                      class="mt-4"
                    >
                      <div class="text-subtitle-2 mb-2">{{ t('log.sql.sqlParams') }}</div>
                      <JsonViewer :data="log.sqlParams" />
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-card-text>
          </v-card>
        </v-timeline-item>

        <v-timeline-item
          v-else
          dot-color="secondary"
          icon="mdi-database-search-outline"
          size="small"
        >
          <!-- No SQL Logs -->
          <v-card variant="outlined">
            <v-card-text class="text-medium-emphasis">
              <v-icon class="mr-2">mdi-database-off-outline</v-icon>
              {{ t('log.trace.noSqlLogs') }}
            </v-card-text>
          </v-card>
        </v-timeline-item>

        <!-- Error Log -->
        <v-timeline-item
          v-if="traceDetail.errorLog"
          dot-color="error"
          icon="mdi-alert-circle-outline"
          size="small"
        >
          <v-card variant="outlined">
            <v-card-title class="text-subtitle-1 text-error">
              {{ t('log.error.title') }}
            </v-card-title>
            <v-card-text>
              <v-row dense>
                <v-col cols="12">
                  <div class="text-medium-emphasis text-caption">
                    {{ t('log.error.errorType') }}
                  </div>
                  <div class="font-weight-medium">
                    {{ traceDetail.errorLog.errorType }}
                  </div>
                </v-col>
                <v-col cols="12">
                  <div class="text-medium-emphasis text-caption">
                    {{ t('log.error.message') }}
                  </div>
                  <div>{{ traceDetail.errorLog.message }}</div>
                </v-col>
              </v-row>

              <!-- Stack Trace -->
              <div class="mt-4">
                <div class="text-subtitle-2 mb-2">
                  {{ t('log.error.stackTrace') }}
                </div>
                <pre class="stack-trace">{{ traceDetail.errorLog.stackTrace }}</pre>
              </div>

              <!-- Request Body (if available) -->
              <div
                v-if="traceDetail.errorLog.requestBody"
                class="mt-4"
              >
                <div class="text-subtitle-2 mb-2">
                  {{ t('log.access.requestBody') }}
                </div>
                <JsonViewer :data="traceDetail.errorLog.requestBody" />
              </div>
            </v-card-text>
          </v-card>
        </v-timeline-item>

        <!-- No Error -->
        <v-timeline-item
          v-else
          dot-color="success"
          icon="mdi-check-circle-outline"
          size="small"
        >
          <v-card variant="outlined">
            <v-card-text class="text-success">
              <v-icon class="mr-2">mdi-check-circle</v-icon>
              {{ t('log.error.noError') }}
            </v-card-text>
          </v-card>
        </v-timeline-item>
      </v-timeline>
    </template>

    <v-snackbar
      v-model="showSnackbar"
      color="success"
      location="top end"
      :timeout="3000"
    >
      {{ t('log.common.copySuccess') }}
    </v-snackbar>
  </v-container>
</template>

<script lang="ts" setup>
import type { OperationType } from '@/api/schemas/operationLog'
import type { TraceDetail } from '@/api/schemas/trace'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import { getTraceDetail } from '@/api/modules/trace'
import { useEnums } from '@/composables/useEnums'
import JsonViewer from './components/JsonViewer.vue'

const { t } = useI18n()
const route = useRoute()

const { labelOf: moduleLabelOf } = useEnums('module')
const { labelOf: subModuleLabelOf } = useEnums('sub-module')
const { labelOf: operationTypeLabelOf } = useEnums('operation')

const traceId = route.params.traceId as string
const traceDetail = ref<TraceDetail | null>(null)
const loading = ref(true)
const error = ref('')
const copiedTraceId = ref(false)
const copiedSqlIds = ref(new Set<number>())
const showSnackbar = ref(false)

onMounted(async () => {
  try {
    traceDetail.value = await getTraceDetail(traceId)
  } catch (error_: unknown) {
    error.value = error_ instanceof Error ? error_.message : 'Failed to load trace detail'
  } finally {
    loading.value = false
  }
})

async function copyTraceId() {
  try {
    await navigator.clipboard.writeText(traceId)
    copiedTraceId.value = true
    showSnackbar.value = true
    setTimeout(() => {
      copiedTraceId.value = false
    }, 3000)
  } catch {
    // Silently fail
  }
}

async function copySqlText(id: number, text: string) {
  try {
    await navigator.clipboard.writeText(text)
    copiedSqlIds.value.add(id)
    showSnackbar.value = true
    setTimeout(() => {
      copiedSqlIds.value.delete(id)
    }, 3000)
  } catch {
    // Silently fail
  }
}

function getStatusCodeColor(statusCode: number): string {
  if (statusCode >= 200 && statusCode < 300) return 'success'
  if (statusCode >= 400 && statusCode < 500) return 'warning'
  if (statusCode >= 500) return 'error'
  return 'default'
}

function getOperationTypeColor(type: OperationType | null): string {
  if (!type) return 'default'
  switch (type) {
    case 'CREATE': {
      return 'success'
    }
    case 'UPDATE': {
      return 'primary'
    }
    case 'DELETE': {
      return 'error'
    }
    default: {
      return 'default'
    }
  }
}

function getSqlTypeColor(sqlType: string | null | undefined): string {
  switch (sqlType) {
    case 'SELECT': {
      return 'info'
    }
    case 'INSERT': {
      return 'success'
    }
    case 'UPDATE': {
      return 'warning'
    }
    case 'DELETE': {
      return 'error'
    }
    default: {
      return 'default'
    }
  }
}

function getDurationColorClass(duration: number | null | undefined): string {
  if (duration == null) return ''
  if (duration > 1000) return 'text-error font-weight-bold'
  if (duration > 500) return 'text-warning'
  return ''
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString()
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString()
}
</script>

<style scoped>
.stack-trace {
  background-color: rgb(var(--v-theme-surface-variant));
  padding: 12px;
  border-radius: 8px;
  overflow: auto;
  max-height: 400px;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 0.75rem;
}

.sql-text {
  background-color: rgb(var(--v-theme-surface-variant));
  padding: 12px;
  border-radius: 8px;
  overflow: auto;
  max-height: 300px;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 0.75rem;
}
</style>
