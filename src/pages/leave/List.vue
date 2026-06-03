<template>
  <v-container>
    <v-row
      align="center"
      class="mb-4"
      density="compact"
    >
      <v-col
        cols="12"
        md="2"
      >
        <v-select
          v-model="filters.year"
          clearable
          density="compact"
          hide-details
          :items="yearOptions"
          :label="t('leave.list.year')"
          variant="outlined"
        />
      </v-col>
      <v-col
        cols="12"
        md="2"
      >
        <v-select
          v-model="filters.leaveType"
          clearable
          density="compact"
          hide-details
          :items="leaveTypeOptions"
          :label="t('leave.list.leaveType')"
          variant="outlined"
        />
      </v-col>
      <v-col
        cols="12"
        md="2"
      >
        <v-select
          v-model="filters.status"
          clearable
          density="compact"
          hide-details
          :items="leaveStatusOptions"
          :label="t('leave.list.status')"
          variant="outlined"
        />
      </v-col>
      <v-col
        cols="12"
        md="auto"
      >
        <v-btn
          class="mr-2"
          color="primary"
          variant="elevated"
          @click="fetchLeaves"
        >
          {{ t('leave.list.search') }}
        </v-btn>
        <v-btn
          variant="outlined"
          @click="resetFilters"
          >{{ t('leave.list.reset') }}</v-btn
        >
      </v-col>
    </v-row>

    <v-data-table-server
      v-model:items-per-page="itemsPerPage"
      v-model:page="page"
      :headers="headers"
      :items="items"
      :items-length="totalItems"
      :loading="loading"
      :mobile="mobile"
      @update:options="fetchLeaves"
    >
      <template #item.leaveType="{ item }">
        {{ leaveTypeLabelOf(item.leaveType) }}
      </template>
      <template #item.status="{ item }">
        <v-chip
          :color="statusColor(item.status)"
          label
          size="small"
        >
          {{ leaveStatusLabelOf(item.status) }}
        </v-chip>
      </template>
      <template #item.startDate="{ item }">
        {{ item.startDate }}
      </template>
      <template #item.duration="{ item }">
        {{ item.duration }} {{ t('leave.list.days') }}
      </template>
      <template #item.attachments="{ item }">
        <template v-if="item.files && item.files.length > 0">
          <v-chip
            v-for="file in item.files"
            :key="file.id"
            class="mr-1 mb-1"
            :color="canPreviewFile(file) ? 'primary' : undefined"
            size="small"
            :variant="canPreviewFile(file) ? 'outlined' : undefined"
            @click="canPreviewFile(file) && openPreview(file)"
          >
            <v-icon
              size="x-small"
              start
              >{{ fileIcon(file) }}</v-icon
            >
            {{ file.originalFilename }}
          </v-chip>
        </template>
        <span
          v-else
          class="text-grey"
          >-</span
        >
      </template>
      <template #item.actions="{ item }">
        <v-btn
          v-if="item.status === 0"
          color="error"
          density="compact"
          icon="mdi-delete-outline"
          size="small"
          :title="t('leave.list.cancel')"
          variant="text"
          @click="handleDelete(item.id)"
        />
      </template>
    </v-data-table-server>

    <v-dialog
      v-model="deleteDialog"
      :max-width="400"
    >
      <v-card>
        <v-card-title>{{ t('leave.list.deleteTitle') }}</v-card-title>
        <v-card-text>{{ t('leave.list.deleteMessage') }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            :disabled="deleteLoading"
            variant="text"
            @click="deleteDialog = false"
          >
            {{ t('leave.list.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            :loading="deleteLoading"
            variant="elevated"
            @click="confirmDelete"
          >
            {{ t('leave.list.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <FilePreviewDialog
      v-model="previewDialog"
      :content-type="previewFileData?.contentType ?? ''"
      :date-url="previewFileData?.dateUrl ?? ''"
      :file-type="previewFileData?.fileType ?? 0"
      :original-filename="previewFileData?.originalFilename ?? ''"
      :stored-name="previewFileData?.storedName ?? ''"
    />
  </v-container>
</template>

<script lang="ts" setup>
import type { FileMetadataResponse, LeavePageResponse } from '@/api/schemas/leave'
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import { deleteLeave, getLeavePage, getYearList } from '@/api/modules/leave'
import FilePreviewDialog from '@/components/FilePreviewDialog.vue'
import { useLeaveStatus } from '@/composables/useLeaveStatus'
import { useLeaveTypes } from '@/composables/useLeaveTypes'

const { t } = useI18n()
const { mobile } = useDisplay()
const { options: leaveTypeOptions, labelOf: leaveTypeLabelOf } = useLeaveTypes()
const { options: leaveStatusOptions, labelOf: leaveStatusLabelOf } = useLeaveStatus()

const page = ref(1)
const itemsPerPage = ref(10)
const totalItems = ref(0)
const items = ref<LeavePageResponse[]>([])
const loading = ref(false)
const yearOptions = ref<number[]>([])

const filters = reactive({
  year: null as number | null,
  leaveType: null as number | null,
  status: null as number | null,
})

const deleteDialog = ref(false)
const deleteTarget = ref<number | null>(null)
const deleteLoading = ref(false)

const previewDialog = ref(false)
const previewFileData = ref<FileMetadataResponse | null>(null)

const FILE_TYPE_IMAGE = 1
const FILE_TYPE_DOCUMENT = 2

const headers = computed(() => [
  { title: t('leave.list.nickname'), key: 'nickname' },
  { title: t('leave.list.leaveType'), key: 'leaveType' },
  { title: t('leave.list.startDate'), key: 'startDate' },
  { title: t('leave.list.endDate'), key: 'endDate' },
  { title: t('leave.list.duration'), key: 'duration' },
  { title: t('leave.list.status'), key: 'status' },
  { title: t('leave.list.attachments'), key: 'attachments', sortable: false },
  { title: t('leave.list.actions'), key: 'actions', sortable: false },
])

function statusColor(status: number) {
  if (status === 0) return 'warning'
  if (status === 1) return 'success'
  return 'error'
}

function fileIcon(file: FileMetadataResponse): string {
  if (file.fileType === FILE_TYPE_IMAGE) return 'mdi-image-outline'
  if (file.contentType?.includes('pdf') || file.originalFilename?.toLowerCase().endsWith('.pdf'))
    return 'mdi-file-pdf-box'
  return 'mdi-file-document-outline'
}

function canPreviewFile(file: FileMetadataResponse): boolean {
  if (file.fileType === FILE_TYPE_IMAGE) return true
  return (
    file.fileType === FILE_TYPE_DOCUMENT &&
    (file.contentType?.includes('pdf') || file.originalFilename?.toLowerCase().endsWith('.pdf'))
  )
}

function openPreview(file: FileMetadataResponse) {
  previewFileData.value = file
  previewDialog.value = true
}

async function fetchLeaves() {
  loading.value = true
  try {
    const res = await getLeavePage({
      page: page.value,
      size: itemsPerPage.value,
      year: filters.year ?? undefined,
      leaveType: filters.leaveType ?? undefined,
      status: filters.status ?? undefined,
    })
    items.value = res.records
    totalItems.value = res.total
  } catch (error: unknown) {
    console.error('Failed to fetch leaves:', error)
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.year = null
  filters.leaveType = null
  filters.status = null
  fetchLeaves()
}

function handleDelete(id: number) {
  deleteTarget.value = id
  deleteDialog.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleteLoading.value = true
  try {
    await deleteLeave(deleteTarget.value)
    deleteDialog.value = false
    fetchLeaves()
  } catch (error: unknown) {
    console.error('Failed to delete leave:', error)
  } finally {
    deleteLoading.value = false
  }
}

onMounted(() => {
  getYearList()
    .then(years => {
      yearOptions.value = years
    })
    .catch(() => {})
  fetchLeaves()
})
</script>
