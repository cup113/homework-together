<script setup lang="ts">
import { useItemsStore } from '@/stores/items';
import { useShareStore } from '@/stores/share';

import LeaderBoardItem from '@/components/LeaderBoardItem.vue';
import ItemDisplay from '@/components/ItemDisplay.vue';
import ItemAdd from '@/components/ItemAdd.vue';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCaption } from '@/components/ui/table';
import TableCell from '@/components/ui/table/TableCell.vue';

const itemsStore = useItemsStore();
const shareStore = useShareStore();
</script>

<template>
  <main class="py-4 px-12 gap-4">
    <div class="flex flex-row grow gap-4">
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
              <TableRow v-for="[id, subject] in itemsStore.subjectsSummary" :key="id">
                <TableCell>{{ subject.name }}</TableCell>
                <TableCell>
                  <meter :value="subject.done" :max="subject.total"></meter>
                  <span>{{ itemsStore.toHumanTime(subject.done) }} / {{ itemsStore.toHumanTime(subject.total) }}</span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>总计</TableCell>
                <TableCell>
                  <meter :value="itemsStore.summary.done" :max="itemsStore.summary.total"></meter>
                  <span>{{ itemsStore.toHumanTime(itemsStore.summary.done) }} / {{ itemsStore.toHumanTime(itemsStore.summary.total) }}</span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div>
          <Table>
            <TableCaption>Leaderboard</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <LeaderBoardItem v-for="user in shareStore.rankedUsers" :key="user.id" :name="user.name" :rank="user.rank"
                :percentage="user.percentage"></LeaderBoardItem>
            </TableBody>
          </Table>
        </div>
      </section>
      <section>
        <div class="flex flex-col gap-1">
          <ItemAdd></ItemAdd>
          <ItemDisplay v-for="item in itemsStore.items" :key="item.id" :item="item"></ItemDisplay>
        </div>
      </section>
    </div>
  </main>
</template>
