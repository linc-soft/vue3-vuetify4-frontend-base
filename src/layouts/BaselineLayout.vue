<script lang="ts" setup>
import { ref } from 'vue'
import { useDisplay } from 'vuetify'
import AppBar from '@/components/AppBar.vue'
import NavigationDrawer from '@/components/NavigationDrawer.vue'

const { mobile } = useDisplay()
const drawer = ref(!mobile.value)

function toggleDrawer() {
  drawer.value = !drawer.value
}
</script>

<template>
  <v-main>
    <NavigationDrawer v-model="drawer" />
    <AppBar @toggle-drawer="toggleDrawer" />

    <router-view />
  </v-main>
</template>
