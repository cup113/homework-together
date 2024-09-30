<script setup lang="ts">
import { useItemsStore } from '@/stores/items';
import ItemDisplay from '@/components/ItemDisplay.vue';

const itemsStore = useItemsStore();
</script>

<template>
  <main class="py-4 px-12">
    <h1>Homework Together</h1>
    <div class="flex">
      <div class="grow">
        <section>
          <h2 class="text-2xl font-bold">个人进度</h2>
        </section>
        <section>
          <h2 class="text-2xl font-bold">作业列表</h2>
          <div>
            <ItemDisplay v-for="item in itemsStore.items" :key="item.id" :item="item"></ItemDisplay>
          </div>
        </section>
      </div>
      <div>
        <h2>Leaderboard</h2>
      </div>
    </div>
  </main>
</template>
