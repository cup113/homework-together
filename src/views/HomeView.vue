<script setup lang="ts">
import { computed } from 'vue';

import { useItemsStore } from '@/stores/items';
import { useShareStore } from '@/stores/share';

import LeaderBoardItem from '@/components/LeaderBoardItem.vue';
import ItemDisplay from '@/components/ItemDisplay.vue';
import ItemAdd from '@/components/ItemAdd.vue';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCaption } from '@/components/ui/table';
import ProgressSlider from '@/components/ProgressSlider.vue';
import TableCell from '@/components/ui/table/TableCell.vue';
import SubjectDisplay from '@/components/SubjectDisplay.vue';
import { useUserStore } from '@/stores/user';

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
  <main class="py-4 px-4 sm:px-8 lg:px-12 gap-4">
    <div class="flex justify-center">
      <section class="flex flex-col gap-8 items-center border-r border-r-slate-200 pr-2 mr-4">
        <div>
          <Table>
            <TableCaption>个人进度</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>学科</TableHead>
                <TableHead>完成度</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell class="font-bold">总计</TableCell>
                <TableCell>
                  <ProgressSlider disabled v-model="overallModel" :max="itemsStore.summary.total"
                    :max-progress="overallProgress.max" :max-name="overallProgress.maxName"
                    :avg-progress="overallProgress.avg"></ProgressSlider>
                  <span>{{ itemsStore.toHumanTime(itemsStore.summary.done) }} / {{
                    itemsStore.toHumanTime(itemsStore.summary.total) }}</span>
                </TableCell>
              </TableRow>
              <SubjectDisplay v-for="subject in itemsStore.subjectsSummary" :key="subject[0]" :subject="subject[1]">
              </SubjectDisplay>
            </TableBody>
          </Table>
        </div>
        <div>
          <Table>
            <TableCaption>Leaderboard</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>排名</TableHead>
                <TableHead>用户名</TableHead>
                <TableHead>完成度</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody class="relative">
              <LeaderBoardItem v-for="user in shareStore.rankedUsers" :key="user.id" :name="user.name ?? '...'"
                :rank="user.rank" :percentage="user.done / user.total * 100"></LeaderBoardItem>
            </TableBody>
          </Table>
        </div>
      </section>
      <section>
        <div class="flex flex-col">
          <ItemAdd></ItemAdd>
          <ItemDisplay v-for="item, i in itemsStore.itemsSorted" :key="item.id" :item="item" :index="i"></ItemDisplay>
          <div class="mt-8 flex justify-between gap-4">
            <Button @click="itemsStore.deleteOutdated('public')" variant="destructive" v-if="permittedToRemoveAll">清除过期作业（所有人）</Button>
            <Button @click="itemsStore.deleteOutdated('user')" variant="destructive">清除过期作业（仅个人）</Button>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>
