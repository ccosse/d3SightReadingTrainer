<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { installSiteMetadata } from './siteMeta'

installSiteMetadata()
onMounted(installSiteMetadata)
</script>
