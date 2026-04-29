<script lang="ts" setup>
import { ref } from 'vue'
import AppBar from '@/components/AppBar.vue'
import NavigationDrawer from '@/components/NavigationDrawer.vue'
import { navItems } from '@/layouts/navItems'

const drawer = ref(true)

function toggleDrawer() {
  drawer.value = !drawer.value
}
</script>

<template>
  <AppBar @toggle-drawer="toggleDrawer" />

  <NavigationDrawer
    v-model="drawer"
    :items="navItems"
  />

  <v-main>
    <router-view />
  </v-main>
</template>
