<script setup lang="ts">
import { RouterView } from 'vue-router';
import NavBar from '@/components/NavBar.vue';
</script>

<template>
  <header>
    <NavBar></NavBar>
  </header>
  <hr>
  <RouterView />
</template>
