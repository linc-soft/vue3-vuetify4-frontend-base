<template>
  <v-container
    class="fill-height d-flex flex-column justify-center"
    max-width="1100"
  >
    <div>
      <v-img
        class="mb-4 font-weight-bold"
        height="150"
        src="@/assets/logo.png"
      />

      <div class="mb-8 text-center">
        <div class="text-body-medium font-weight-light mb-n1">Welcome to</div>
        <div class="text-display-medium font-weight-bold">Vuetify</div>
      </div>

      <v-row>
        <v-col cols="12">
          <v-card
            class="py-4"
            color="surface-variant"
            image="https://cdn.vuetifyjs.com/docs/images/one/create/feature.png"
            rounded="lg"
            variant="tonal"
          >
            <template #prepend>
              <v-avatar
                class="ml-2 mr-4"
                icon="mdi-rocket-launch-outline"
                size="60"
                variant="tonal"
              />
            </template>

            <template #image>
              <v-img position="top right" />
            </template>

            <template #title>
              <div class="my-title my-uppercase text-headline-medium font-weight-bold">
                Get started
              </div>
            </template>

            <template #subtitle>
              <div class="text-body-large">
                Change this page by updating <v-kbd>{{ `<HelloWorld />` }}</v-kbd> in
                <v-kbd>components/HelloWorld.vue</v-kbd>.
              </div>
            </template>
          </v-card>
        </v-col>

        <!-- Backend I18n Test Section -->
        <v-col cols="12">
          <v-card
            class="py-4"
            color="surface-variant"
            rounded="lg"
            variant="tonal"
          >
            <template #prepend>
              <v-avatar
                class="ml-2 mr-4"
                icon="mdi-translate"
                size="60"
                variant="tonal"
              />
            </template>

            <template #title>
              <div class="text-headline-medium font-weight-bold">Backend I18n Test</div>
            </template>

            <template #subtitle>
              <div class="text-body-large">Test backend internationalization endpoints</div>
            </template>

            <v-card-text>
              <v-row>
                <v-col
                  cols="12"
                  md="4"
                >
                  <v-btn
                    block
                    color="primary"
                    :loading="loading.test"
                    prepend-icon="mdi-play"
                    variant="elevated"
                    @click="testI18nTest"
                  >
                    GET /api/common/i18n/test
                  </v-btn>
                </v-col>
                <v-col
                  cols="12"
                  md="4"
                >
                  <v-btn
                    block
                    color="primary"
                    :loading="loading.result"
                    prepend-icon="mdi-play"
                    variant="elevated"
                    @click="testI18nResult"
                  >
                    GET /api/common/i18n/result
                  </v-btn>
                </v-col>
                <v-col
                  cols="12"
                  md="4"
                >
                  <v-btn
                    block
                    color="primary"
                    :loading="loading.formatted"
                    prepend-icon="mdi-play"
                    variant="elevated"
                    @click="testI18nResultFormatted"
                  >
                    GET /api/common/i18n/result-formatted
                  </v-btn>
                </v-col>
              </v-row>

              <v-alert
                v-if="error"
                class="mt-4"
                closable
                density="compact"
                type="error"
                variant="tonal"
                @click:close="error = null"
              >
                {{ error }}
              </v-alert>

              <v-card
                v-if="responseData"
                class="mt-4"
                variant="outlined"
              >
                <v-card-title class="text-subtitle-1">
                  Response
                  <v-chip
                    class="ml-2"
                    color="success"
                    size="small"
                  >
                    {{ currentEndpoint }}
                  </v-chip>
                </v-card-title>
                <v-card-text>
                  <pre class="text-body-2 overflow-auto">{{ formattedResponse }}</pre>
                </v-card-text>
              </v-card>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col
          v-for="link in links"
          :key="link.href"
          cols="6"
        >
          <v-card
            append-icon="mdi-open-in-new"
            class="py-4"
            color="surface-variant"
            :href="link.href"
            rel="noopener noreferrer"
            rounded="lg"
            :subtitle="link.subtitle"
            target="_blank"
            :title="link.title"
            variant="tonal"
          >
            <template #prepend>
              <v-avatar
                class="ml-2 mr-4"
                :icon="link.icon"
                size="60"
                variant="tonal"
              />
            </template>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import { getI18nResult, getI18nResultFormatted, getI18nTest } from '@/api/modules/common'

const links = [
  {
    href: 'https://vuetifyjs.com/',
    icon: 'mdi-text-box-outline',
    subtitle: 'Learn about all things Vuetify in our documentation.',
    title: 'Documentation',
  },
  {
    href: 'https://vuetifyjs.com/introduction/why-vuetify/#feature-guides',
    icon: 'mdi-star-circle-outline',
    subtitle: 'Explore available framework Features.',
    title: 'Features',
  },
  {
    href: 'https://vuetifyjs.com/components/all',
    icon: 'mdi-widgets-outline',
    subtitle: 'Discover components in the API Explorer.',
    title: 'Components',
  },
  {
    href: 'https://discord.vuetifyjs.com',
    icon: 'mdi-account-group-outline',
    subtitle: 'Connect with Vuetify developers.',
    title: 'Community',
  },
]

const loading = ref({
  test: false,
  result: false,
  formatted: false,
})

const error = ref<string | null>(null)
const responseData = ref<unknown>(null)
const currentEndpoint = ref('')

const formattedResponse = ref('')

async function testI18nTest() {
  loading.value.test = true
  error.value = null
  currentEndpoint.value = '/api/common/i18n/test'
  try {
    const result = await getI18nTest()
    responseData.value = result
    formattedResponse.value = result
  } catch (error_) {
    error.value = error_ instanceof Error ? error_.message : 'Request failed'
    responseData.value = null
  } finally {
    loading.value.test = false
  }
}

async function testI18nResult() {
  loading.value.result = true
  error.value = null
  currentEndpoint.value = '/api/common/i18n/result'
  try {
    const result = await getI18nResult()
    responseData.value = result
    formattedResponse.value = JSON.stringify(result, null, 2)
  } catch (error_) {
    error.value = error_ instanceof Error ? error_.message : 'Request failed'
    responseData.value = null
  } finally {
    loading.value.result = false
  }
}

async function testI18nResultFormatted() {
  loading.value.formatted = true
  error.value = null
  currentEndpoint.value = '/api/common/i18n/result-formatted'
  try {
    const result = await getI18nResultFormatted()
    responseData.value = result
    formattedResponse.value = result
  } catch (error_) {
    error.value = error_ instanceof Error ? error_.message : 'Request failed'
    responseData.value = null
  } finally {
    loading.value.formatted = false
  }
}
</script>
