<script setup lang="ts">
import { computed } from 'vue';

import { useItemsStore } from '@/stores/items';
import { useShareStore } from '@/stores/share';

import LeaderBoardItem from '@/components/LeaderBoardItem.vue';
import ItemDisplay from '@/components/ItemDisplay.vue';
import ItemAdd from '@/components/ItemAdd.vue';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCaption } from '@/components/ui/table';
import ProgressSlider from '@/components/ProgressSlider.vue';
import TableCell from '@/components/ui/table/TableCell.vue';
import SubjectDisplay from '@/components/SubjectDisplay.vue';

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
</script>

<template>
  <main class="py-4 px-4 sm:px-8 lg:px-12 gap-4">
    <div class="flex grow gap-4">
      <section class="flex flex-col gap-8 items-center border-r border-r-slate-200">
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
        <div class="flex flex-col gap-1">
          <ItemAdd></ItemAdd>
          <ItemDisplay v-for="item, i in itemsStore.itemsSorted" :key="item.id" :item="item" :index="i"></ItemDisplay>
        </div>
      </section>
    </div>
  </main>
</template>
