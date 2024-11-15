<script setup lang="ts">
import { RouterView } from 'vue-router';
import NavBar from '@/components/NavBar.vue';
</script>

<template>
  <div>
    <header class="sticky top-0 bg-secondary z-10">
      <NavBar></NavBar>
    </header>
    <hr>
    <RouterView>
    </RouterView>
  </div>
</template>

<style>
</style>
