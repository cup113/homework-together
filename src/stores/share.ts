import { defineStore } from 'pinia';
import { ref, reactive, computed, nextTick } from 'vue';
import { useNetworkStore } from './network';
import { useUserStore } from './user';
import type { SharedProgress } from '@/../types/contract';
import dayjs from 'dayjs';

export const useShareStore = defineStore('share', () => {
    const sharedProgress = reactive<SharedProgress>({
        items: {},
        subjects: {},
        overall: {},
        users: [],
    });
    const lastUpdated = ref(dayjs().subtract(1, 'hour')); // to enable first update

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
        if (dayjs().diff(lastUpdated.value, 'minute') < 1) {
            return;
        }
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
        store.onChecked(() => setInterval(() => refreshProgress(), 1000 * 60 * 5));
    });

    return {
        rankedUsers,
        sharedProgress,
        refreshProgress,
    }
});
