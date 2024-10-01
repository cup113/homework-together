<script setup lang="ts">
import { useItemsStore } from '@/stores/items';
import { useShareStore } from '@/stores/share';

import LeaderBoardItem from '@/components/LeaderBoardItem.vue';
import { Icon } from '@iconify/vue';
import ItemDisplay from '@/components/ItemDisplay.vue';
import ItemAdd from '@/components/ItemAdd.vue';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCaption } from '@/components/ui/table';

const itemsStore = useItemsStore();
const shareStore = useShareStore();
</script>

<template>
  <main class="py-4 px-12">
    <h1 class="text-3xl font-bold">Homework Together</h1>
    <div class="flex">
      <div class="grow">
        <section>
          <h2 class="text-2xl font-bold">个人进度</h2>
        </section>
        <section>
          <div>
            <Table>
              <TableCaption>作业列表</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Icon icon="ph:exam"></Icon>学科
                  </TableHead>
                  <TableHead>
                    <Icon icon="material-symbols-light:text-ad-rounded"></Icon>内容
                  </TableHead>
                  <TableHead>
                    <Icon icon="carbon:progress-bar"></Icon>进度
                  </TableHead>
                  <TableHead>
                    <Icon icon="tabler:tag-filled"></Icon>性质
                  </TableHead>
                  <TableHead>
                    <Icon icon="hugeicons:estimate-02"></Icon>预计时间
                  </TableHead>
                  <TableHead>
                    <Icon icon="icon-park:deadline-sort"></Icon>截止时间
                  </TableHead>
                  <TableHead>
                    <Icon icon="ep:operation"></Icon>操作
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <ItemDisplay v-for="item in itemsStore.items" :key="item.id" :item="item"></ItemDisplay>
                <ItemAdd></ItemAdd>
              </TableBody>
            </Table>
          </div>
        </section>
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
    </div>
  </main>
</template>
