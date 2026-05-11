<template>
  <div class="diff-viewer">
    <div class="d-flex align-center mb-2">
      <v-btn
        density="compact"
        :prepend-icon="expanded ? 'mdi-chevron-down' : 'mdi-chevron-right'"
        size="small"
        variant="text"
        @click="expanded = !expanded"
      >
        {{ expanded ? t('log.common.collapse') : t('log.common.expand') }}
      </v-btn>
    </div>
    <v-expand-transition>
      <div
        v-show="expanded"
        class="diff-content"
      >
        <div
          v-for="(line, index) in diffLines"
          :key="index"
          :class="['diff-line', line.type]"
        >
          <span class="diff-prefix">{{ line.prefix }}</span>
          <span class="diff-text">{{ line.text }}</span>
        </div>
      </div>
    </v-expand-transition>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    before: string | object | null | undefined
    after: string | object | null | undefined
    showUnchanged?: boolean
  }>(),
  {
    showUnchanged: false,
  },
)

const { t } = useI18n()
const expanded = ref(true)

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged'
  prefix: string
  text: string
}

const diffLines = computed((): DiffLine[] => {
  const beforeObj = parseJson(props.before)
  const afterObj = parseJson(props.after)

  if (!beforeObj && !afterObj) return []
  if (!beforeObj) {
    return Object.entries(afterObj as Record<string, unknown>).map(([key, value]) => ({
      type: 'added',
      prefix: '+',
      text: `${key}: ${JSON.stringify(value)}`,
    }))
  }
  if (!afterObj) {
    return Object.entries(beforeObj as Record<string, unknown>).map(([key, value]) => ({
      type: 'removed',
      prefix: '-',
      text: `${key}: ${JSON.stringify(value)}`,
    }))
  }

  const lines: DiffLine[] = []
  const allKeys = new Set([
    ...Object.keys(beforeObj),
    ...Object.keys(afterObj as Record<string, unknown>),
  ])
  const before = beforeObj as Record<string, unknown>
  const after = afterObj as Record<string, unknown>

  for (const key of allKeys) {
    const beforeValue = before[key]
    const afterValue = after[key]

    if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
      if (beforeValue !== undefined) {
        lines.push({
          type: 'removed',
          prefix: '-',
          text: `${key}: ${JSON.stringify(beforeValue)}`,
        })
      }
      if (afterValue !== undefined) {
        lines.push({
          type: 'added',
          prefix: '+',
          text: `${key}: ${JSON.stringify(afterValue)}`,
        })
      }
    } else if (props.showUnchanged) {
      lines.push({
        type: 'unchanged',
        prefix: ' ',
        text: `${key}: ${JSON.stringify(beforeValue)}`,
      })
    }
  }

  return lines
})

function parseJson(data: string | object | null | undefined): object | null {
  if (!data) return null
  try {
    return typeof data === 'string' ? JSON.parse(data) : data
  } catch {
    return null
  }
}
</script>

<style scoped>
.diff-viewer {
  font-size: 0.875rem;
}

.diff-content {
  background-color: rgb(var(--v-theme-surface-variant));
  border-radius: 8px;
  overflow: auto;
  max-height: 300px;
  font-family: 'Fira Code', 'Consolas', monospace;
}

.diff-line {
  padding: 2px 8px;
  display: flex;
}

.diff-line.added {
  background-color: rgba(76, 175, 80, 0.15);
  color: rgb(var(--v-theme-success));
}

.diff-line.removed {
  background-color: rgba(244, 67, 54, 0.15);
  color: rgb(var(--v-theme-error));
}

.diff-prefix {
  width: 20px;
  flex-shrink: 0;
  text-align: center;
}

.diff-text {
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
