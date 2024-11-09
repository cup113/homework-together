<script setup lang="ts">
import { computed } from 'vue';

import { useItemsStore } from '@/stores/items';
import { useUserStore } from '@/stores/user';

import LeaderBoard from '@/components/SummaryBoard.vue'
import ItemDisplay from '@/components/ItemDisplay.vue';
import ItemAdd from '@/components/ItemAdd.vue';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';

const itemsStore = useItemsStore();

const permittedToRemoveAll = computed(() => {
  const userStore = useUserStore();
  return userStore.user?.organizations[0]?.leader === userStore.user?.id || userStore.user?.organizations?.[0]?.managers?.includes(userStore.user.id);
});
</script>

<template>
  <main class="py-4 px-4 sm:px-8 lg:px-12">
    <div class="flex justify-center">
      <section class="border-r border-r-slate-200 pr-2 mr-2 box-content lg:pr-6 lg:mr-6">
        <LeaderBoard></LeaderBoard>
      </section>
      <section>
        <div class="flex flex-col">
          <Collapsible class="border border-slate-200 rounded-lg mb-4">
            <CollapsibleTrigger class="w-full text-center font-bold py-1">
              点击添加作业
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ItemAdd></ItemAdd>
            </CollapsibleContent>
          </Collapsible>
          <ItemDisplay v-for="item, i in itemsStore.itemsSorted" :key="item.id" :item="item" :index="i"></ItemDisplay>
          <div v-if="itemsStore.itemsLoading">
            <Skeleton class="w-full h-24"></Skeleton>
          </div>
          <div class="mt-8 flex justify-between gap-4">
            <Button @click="itemsStore.deleteOutdated('public')" variant="destructive" class="bg-[#edcbc0] hover:bg-[#f0a381]"
              v-if="permittedToRemoveAll">清除过期作业（所有人）</Button>
            <Button @click="itemsStore.deleteOutdated('user')" variant="destructive" class="bg-[#edcbc0] hover:bg-[#f0a381]">清除过期作业（仅个人）</Button>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>
