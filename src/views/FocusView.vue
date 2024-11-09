<script setup lang="ts">
import { computed } from 'vue';

import { useItemsStore } from '@/stores/items';
import { useUserStore } from '@/stores/user';

import LeaderBoard from '@/components/SummaryBoard.vue'
import ItemDisplay from '@/components/ItemDisplay.vue';

const itemsStore = useItemsStore();
const userStore = useUserStore();

const item = computed(() => {
  const publicId = userStore.user?.workingOn;
  if (!publicId) {
    return undefined;
  }
  return itemsStore.items.find(i => i.publicItem === publicId);
});
</script>

<template>
  <main class="py-4 px-4 sm:px-8 lg:px-12">
    <div class="flex justify-center">
      <section class="border-r border-r-slate-200 pr-2 mr-2 box-content lg:pr-6 lg:mr-6">
        <LeaderBoard></LeaderBoard>
      </section>
      <section class="flex-grow">
        <ItemDisplay v-if="item !== undefined" :key="item.id" :item="item" :index="0" focus-mode></ItemDisplay>
      </section>
    </div>
  </main>
</template>
