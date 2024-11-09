<script setup lang="ts">
import { computed } from 'vue';
import { useShareStore } from '@/stores/share';
import LeaderBoardItem from '@/components/LeaderBoardItem.vue';
import type { OrganizationsResponse } from 'types/pocketbase-types';

const props = defineProps<{
    organization: OrganizationsResponse;
}>();
const shareStore = useShareStore();

const progress = computed(() => shareStore.sharedProgress[props.organization.id]);
const rankedUsers = computed(() => {
    if (!progress.value) {
        return [];
    }
    return progress.value.users.map(user => {
        if (!progress.value.overall[user.id]) {
            return undefined;
        }
        return {
            ...user,
            done: progress.value.overall[user.id][0],
            total: progress.value.overall[user.id][1],
        };
    }).filter(user => user !== undefined).sort((a, b) => b.done / b.total - a.done / a.total).map((user, index) => ({ ...user, rank: index + 1 }));
});
</script>

<template>
    <div class="border-t border-slate-300 border-solid">
        <h3 class="font-bold text-center mb-2 mt-1">{{ organization.name }}</h3>
        <LeaderBoardItem v-for="user in rankedUsers" :key="user.id" :name="user.name" :rank="user.rank" :user="user">
        </LeaderBoardItem>
    </div>
</template>
