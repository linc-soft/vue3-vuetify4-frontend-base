<template>
  <v-container>
    <v-card :title="t('regulations.title')">
      <v-card-text>
        <v-btn
          v-if="canUpload"
          class="mb-4"
          color="primary"
          prepend-icon="mdi-upload"
          variant="tonal"
          @click="uploadDialog = true"
        >
          {{ t('regulations.upload') }}
        </v-btn>

        <v-table>
          <thead>
            <tr>
              <th>{{ t('regulations.table.fileName') }}</th>
              <th>{{ t('regulations.table.uploader') }}</th>
              <th>{{ t('regulations.table.uploadDate') }}</th>
              <th>{{ t('regulations.table.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="file in files"
              :key="file.id"
            >
              <td>{{ file.originalFilename }}</td>
              <td>{{ file.uploader }}</td>
              <td>{{ file.uploadDate }}</td>
              <td>
                <v-btn
                  v-if="canPreview(file)"
                  density="compact"
                  icon="mdi-eye-outline"
                  size="small"
                  :title="t('regulations.preview')"
                  variant="text"
                  @click="openPreview(file)"
                />
                <v-btn
                  density="compact"
                  icon="mdi-download"
                  size="small"
                  :title="t('regulations.download')"
                  variant="text"
                  @click="handleDownload(file)"
                />
              </td>
            </tr>
            <tr v-if="files.length === 0">
              <td
                class="text-center text-grey"
                colspan="4"
              >
                {{ t('regulations.noFiles') }}
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <v-dialog
      v-model="uploadDialog"
      :max-width="500"
    >
      <v-card>
        <v-card-title>{{ t('regulations.uploadTitle') }}</v-card-title>
        <v-card-text>
          <v-file-input
            v-model="uploadFile_"
            :label="t('regulations.selectFile')"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="uploadDialog = false"
            >{{ t('regulations.cancel') }}</v-btn
          >
          <v-btn
            color="primary"
            :disabled="!uploadFile_"
            :loading="uploading"
            variant="elevated"
            @click="handleUpload"
          >
            {{ t('regulations.upload') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <FilePreviewDialog
      v-model="previewDialog"
      :content-type="previewFile?.contentType ?? ''"
      :date-url="previewFile?.dateUrl ?? ''"
      :file-type="previewFile?.fileType ?? 0"
      :original-filename="previewFile?.originalFilename ?? ''"
      :stored-name="previewFile?.storedName ?? ''"
    />
  </v-container>
</template>

<script lang="ts" setup>
import type { RegulationsFileResponse } from '@/api/modules/regulations'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { downloadFile } from '@/api/modules/file'
import { getRegulationsList, uploadRegulations } from '@/api/modules/regulations'
import FilePreviewDialog from '@/components/FilePreviewDialog.vue'

const { t } = useI18n()
const files = ref<RegulationsFileResponse[]>([])
const uploadDialog = ref(false)
const uploadFile_ = ref<File | null>(null)
const uploading = ref(false)
const canUpload = ref(true)

const previewDialog = ref(false)
const previewFile = ref<RegulationsFileResponse | null>(null)

const FILE_TYPE_IMAGE = 1
const FILE_TYPE_DOCUMENT = 2

function canPreview(file: RegulationsFileResponse): boolean {
  return file.fileType === FILE_TYPE_IMAGE || isPdf(file)
}

function isPdf(file: RegulationsFileResponse): boolean {
  return (
    file.fileType === FILE_TYPE_DOCUMENT &&
    (file.contentType?.includes('pdf') || file.originalFilename?.toLowerCase().endsWith('.pdf'))
  )
}

function openPreview(file: RegulationsFileResponse) {
  previewFile.value = file
  previewDialog.value = true
}

async function fetchFiles() {
  try {
    files.value = await getRegulationsList()
  } catch (error: unknown) {
    console.error('Failed to fetch regulations:', error)
  }
}

async function handleUpload() {
  if (!uploadFile_.value) return
  uploading.value = true
  try {
    await uploadRegulations(uploadFile_.value)
    uploadDialog.value = false
    uploadFile_.value = null
    await fetchFiles()
  } catch (error: unknown) {
    console.error('Failed to upload regulations:', error)
  } finally {
    uploading.value = false
  }
}

async function handleDownload(file: RegulationsFileResponse) {
  try {
    const { blob } = await downloadFile(file.dateUrl, file.storedName)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.originalFilename
    a.click()
    URL.revokeObjectURL(url)
  } catch (error: unknown) {
    console.error('Failed to download file:', error)
  }
}

onMounted(() => {
  fetchFiles()
})
</script>
