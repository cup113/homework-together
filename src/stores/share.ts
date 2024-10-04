import { defineStore } from 'pinia';
import { reactive, computed, nextTick } from 'vue';
import { useNetworkStore } from './network';
import { useUserStore } from './user';
import type { SharedProgress } from 'types/contract';

export const useShareStore = defineStore('share', () => {
    const sharedProgress = reactive<SharedProgress>({
        items: {},
        subjects: {},
        overall: {},
        users: [],
    });

    const rankedUsers = computed(() => {
        return Object.entries(sharedProgress.overall)
            .map(([userId, progress]) => ({ userId, done: progress[0], total: progress[1] })).sort((a, b) => b.done / b.total - a.done / a.total)
            .map(({ userId, done, total }, index) => ({
                ...sharedProgress.users.find((user) => user.id === userId),
                done,
                total,
                rank: index + 1,
            }))
    });

    async function refreshProgress() {
        const network = useNetworkStore();
        const progress = await network.client.organizations.progress.query();
        if (progress.status === 200) {
            sharedProgress.users = progress.body.users;
            sharedProgress.items = progress.body.items;
            sharedProgress.subjects = progress.body.subjects;
            sharedProgress.overall = progress.body.overall;
        } else {
            console.error(progress.body);
            alert('Failed to fetch progress');
        }
    }

    nextTick(() => {
        const store = useUserStore();
        store.onChecked(refreshProgress);
    });

    return {
        rankedUsers,
    }
});
