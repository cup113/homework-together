<script setup lang="ts">
import { RouterView } from 'vue-router';
import NavBar from '@/components/NavBar.vue';
import { useNetworkStore } from '@/stores/network';

const networkStore = useNetworkStore();
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header class="sticky top-0 bg-white z-10">
      <NavBar></NavBar>
      <hr>
    </header>
    <main class="flex-grow">
      <RouterView>
      </RouterView>
    </main>
    <footer class="bg-slate-100 text-slate-700 text-center text-sm mt-8 py-4">
      <div class="flex gap-8 justify-center">
        <div>Homework Together</div>
        <div><a href="https://github.com/cup113/homework-together" target="_blank"
            class="underline hover:bg-slate-200 rounded-md">Open Source</a></div>
        <div>Build Version: {{ networkStore.buildVersion }}</div>
      </div>
    </footer>
  </div>
</template>

<style></style>
