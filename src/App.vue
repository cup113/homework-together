<script setup lang="ts">
import { RouterView } from 'vue-router';
import NavBar from '@/components/NavBar.vue';
import MyFooter from './components/MyFooter.vue';

</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header class="sticky top-0 bg-white z-10">
      <NavBar></NavBar>
      <hr>
    </header>
    <main class="flex-grow">
      <RouterView></RouterView>
    </main>
    <MyFooter></MyFooter>
  </div>
</template>
