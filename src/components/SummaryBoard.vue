<script setup lang="ts">
import { computed } from 'vue';

import { useShareStore } from '@/stores/share';
import { useItemsStore } from '@/stores/items';
import { useTimeStore } from '@/stores/time';
import { useUserStore } from '@/stores/user';

import LeaderBoard from '@/components/LeaderBoard.vue';
import ProgressSlider from '@/components/ProgressSlider.vue';
import SubjectDisplay from '@/components/SubjectDisplay.vue';

const shareStore = useShareStore();
const itemsStore = useItemsStore();
const timeStore = useTimeStore();
const userStore = useUserStore();

const overallModel = computed({
  get() { return [itemsStore.summary.done / itemsStore.summary.total * 100] },
  set() { },
});
const overallProgress = computed(() => {
  const users = Object.entries(shareStore.sharedProgress).map(([organizationId, progress]) => {
    return progress.users.map(user => Object.assign(user, { organizationId }));
  }).flat();
  return Object.fromEntries(users.map(user => {
    const userProgress = shareStore.sharedProgress[user.organizationId].overall[user.id];
    if (!userProgress) return null;
    return [user.name, userProgress[0] / userProgress[1] * 100];
  }).filter(user => user !== null))
});

const organizations = computed(() => userStore.user?.organizations ?? []);
</script>

<template>
  <div>
    <div>
      <h2 class="text-center font-bold mb-2">排行榜</h2>
      <LeaderBoard v-for="organization in organizations" :key="organization.id" :organization="organization"></LeaderBoard>
    </div>
    <div class="pt-4 px-1">
      <h2 class="text-center font-bold mb-2">个人进度</h2>
      <div class="flex items-center gap-3 py-2 px-2 border-b border-slate-200">
        <div class="font-bold">总计</div>
        <div class="grow">
          <ProgressSlider disabled v-model="overallModel" :max="100" :progress-data="overallProgress">
          </ProgressSlider>
          <div class="text-slate-500 ml-4">{{ timeStore.format_regular(itemsStore.summary.done) }} / {{
            timeStore.format_regular(itemsStore.summary.total) }}</div>
        </div>
      </div>
      <SubjectDisplay v-for="subject in itemsStore.subjectsSummary" :key="subject[0]" :subject="subject[1]">
      </SubjectDisplay>
    </div>
  </div>
</template>
