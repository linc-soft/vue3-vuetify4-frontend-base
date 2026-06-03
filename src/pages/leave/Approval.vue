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
          v-model="filters.leaveType"
          clearable
          density="compact"
          hide-details
          :items="leaveTypeOptions"
          :label="t('leave.approval.leaveType')"
          variant="outlined"
        />
      </v-col>
      <v-col
        cols="12"
        md="auto"
      >
        <v-btn
          color="primary"
          variant="elevated"
          @click="fetchLeaves"
        >
          {{ t('leave.approval.search') }}
        </v-btn>
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
          color="success"
          density="compact"
          icon="mdi-check"
          size="small"
          :title="t('leave.approval.approve')"
          variant="text"
          @click="handleApprove(item)"
        />
        <v-btn
          v-if="item.status === 0"
          color="error"
          density="compact"
          icon="mdi-close"
          size="small"
          :title="t('leave.approval.reject')"
          variant="text"
          @click="handleReject(item)"
        />
      </template>
    </v-data-table-server>

    <v-dialog
      v-model="rejectDialog"
      :max-width="400"
    >
      <v-card>
        <v-card-title>{{ t('leave.approval.rejectTitle') }}</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="rejectReason"
            density="compact"
            :label="t('leave.approval.rejectReason')"
            rows="3"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="rejectDialog = false"
            >{{ t('leave.approval.cancel') }}</v-btn
          >
          <v-btn
            color="error"
            :loading="actionLoading"
            variant="elevated"
            @click="confirmReject"
          >
            {{ t('leave.approval.confirm') }}
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
import { getLeavePage, updateLeaveStatus } from '@/api/modules/leave'
import FilePreviewDialog from '@/components/FilePreviewDialog.vue'
import { useLeaveStatus } from '@/composables/useLeaveStatus'
import { useLeaveTypes } from '@/composables/useLeaveTypes'

const { t } = useI18n()
const { mobile } = useDisplay()
const { options: leaveTypeOptions, labelOf: leaveTypeLabelOf } = useLeaveTypes()
const { labelOf: leaveStatusLabelOf } = useLeaveStatus()

const page = ref(1)
const itemsPerPage = ref(10)
const totalItems = ref(0)
const items = ref<LeavePageResponse[]>([])
const loading = ref(false)
const actionLoading = ref(false)
const rejectDialog = ref(false)
const rejectReason = ref('')
const rejectTarget = ref<LeavePageResponse | null>(null)

const previewDialog = ref(false)
const previewFileData = ref<FileMetadataResponse | null>(null)

const FILE_TYPE_IMAGE = 1
const FILE_TYPE_DOCUMENT = 2

const filters = reactive({ leaveType: null as number | null })

const headers = computed(() => [
  { title: t('leave.approval.nickname'), key: 'nickname' },
  { title: t('leave.approval.leaveType'), key: 'leaveType' },
  { title: t('leave.approval.period'), key: 'startDate' },
  { title: t('leave.approval.duration'), key: 'duration' },
  { title: t('leave.approval.reason'), key: 'reason' },
  { title: t('leave.approval.attachments'), key: 'attachments', sortable: false },
  { title: t('leave.approval.status'), key: 'status' },
  { title: t('leave.approval.actions'), key: 'actions', sortable: false },
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
      status: 0,
      leaveType: filters.leaveType ?? undefined,
    })
    items.value = res.records
    totalItems.value = res.total
  } catch (error: unknown) {
    console.error('Failed to fetch leaves:', error)
  } finally {
    loading.value = false
  }
}

async function handleApprove(item: LeavePageResponse) {
  actionLoading.value = true
  try {
    await updateLeaveStatus({ id: item.id, status: 'APPROVED' })
    fetchLeaves()
  } catch (error: unknown) {
    console.error('Failed to approve leave:', error)
  } finally {
    actionLoading.value = false
  }
}

function handleReject(item: LeavePageResponse) {
  rejectTarget.value = item
  rejectReason.value = ''
  rejectDialog.value = true
}

async function confirmReject() {
  if (!rejectTarget.value) return
  actionLoading.value = true
  try {
    await updateLeaveStatus({
      id: rejectTarget.value.id,
      status: 'REJECTED',
      reason: rejectReason.value || undefined,
    })
    rejectDialog.value = false
    fetchLeaves()
  } catch (error: unknown) {
    console.error('Failed to reject leave:', error)
  } finally {
    actionLoading.value = false
  }
}

onMounted(() => {
  fetchLeaves()
})
</script>
