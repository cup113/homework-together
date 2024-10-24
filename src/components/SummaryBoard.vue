<script setup lang="ts">
import { computed } from 'vue';

import { useShareStore } from '@/stores/share';
import { useItemsStore } from '@/stores/items';

import LeaderBoardItem from '@/components/LeaderBoardItem.vue';
import ProgressSlider from '@/components/ProgressSlider.vue';
import SubjectDisplay from '@/components/SubjectDisplay.vue';

const shareStore = useShareStore();
const itemsStore = useItemsStore();

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
</script>

<template>
    <div>
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
    </div>
</template>
