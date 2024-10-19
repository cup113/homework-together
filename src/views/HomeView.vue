<script setup lang="ts">
import { computed } from 'vue';

import { useItemsStore } from '@/stores/items';
import { useShareStore } from '@/stores/share';
import { useUserStore } from '@/stores/user';

import LeaderBoardItem from '@/components/LeaderBoardItem.vue';
import ItemDisplay from '@/components/ItemDisplay.vue';
import ItemAdd from '@/components/ItemAdd.vue';
import ProgressSlider from '@/components/ProgressSlider.vue';
import SubjectDisplay from '@/components/SubjectDisplay.vue';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';

const itemsStore = useItemsStore();
const shareStore = useShareStore();

const overallModel = computed({
  get() { return [itemsStore.summary.done] },
  set() { },
});
const overallProgress = computed(() => {
  const userProgress = Object.entries(shareStore.sharedProgress.overall)
    .map(([id, p]) => ({ id, progress: p[0] / p[1] }));
  if (userProgress.length === 0) {
    return {
      max: undefined,
      maxNames: [],
      avg: undefined,
    };
  }
  const max = Math.max.apply(null, userProgress.map(p => p.progress));
  const maxNames = userProgress.filter(p => p.progress === max)
    .map(p => shareStore.sharedProgress.users.find(u => u.id === p.id)?.name)
    .filter(name => name !== undefined);
  const avg = userProgress.reduce((acc, cur) => acc + cur.progress, 0) / userProgress.length;
  return {
    max,
    maxName: maxNames.join(', '),
    avg,
  };
});
const permittedToRemoveAll = computed(() => {
  const userStore = useUserStore();
  return userStore.user.organizations[0]?.leader === userStore.user.id || userStore.user.organizations[0]?.managers?.includes(userStore.user.id);
});
</script>

<template>
  <main class="py-4 px-4 sm:px-8 lg:px-12">
    <div class="flex justify-center">
      <section class="border-r border-r-slate-200 pr-2 mr-2 box-content lg:pr-6 lg:mr-6">
        <div>
          <h2 class="text-center font-bold mb-2">排行榜</h2>
          <LeaderBoardItem v-for="user in shareStore.rankedUsers" :key="user.id" :name="user.name ?? '...'"
            :rank="user.rank" :user="user"></LeaderBoardItem>
        </div>
        <div class="pt-4 px-1">
          <h2 class="text-center font-bold mb-2">个人进度</h2>
          <div class="flex items-center gap-3 py-2 px-2 border-b border-slate-200">
            <div class="font-bold">总计</div>
            <div class="grow">
              <ProgressSlider disabled v-model="overallModel" :max="itemsStore.summary.total"
                :max-progress="overallProgress.max" :max-name="overallProgress.maxName"
                :avg-progress="overallProgress.avg"></ProgressSlider>
              <div class="text-slate-500 ml-4">{{ itemsStore.toHumanTime(itemsStore.summary.done) }} / {{
                itemsStore.toHumanTime(itemsStore.summary.total) }}</div>
            </div>
          </div>
          <SubjectDisplay v-for="subject in itemsStore.subjectsSummary" :key="subject[0]" :subject="subject[1]">
          </SubjectDisplay>
        </div>
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
