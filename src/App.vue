<script setup lang="ts">
import { RouterView } from 'vue-router';
import NavBar from '@/components/NavBar.vue';
</script>

<template>
  <div>
    <header>
      <NavBar></NavBar>
    </header>
    <hr>
    <RouterView>
    </RouterView>
  </div>
</template>

<style>
</style>
