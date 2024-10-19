import { defineStore } from 'pinia';
import { ref, reactive, computed, nextTick } from 'vue';
import { useNetworkStore } from './network';
import { useUserStore } from './user';
import type { SharedProgress } from '@/../types/contract';
import type { ProgressChange } from '@/../types/ws';

export const useShareStore = defineStore('share', () => {
    const sharedProgress = reactive<SharedProgress>({
        items: {},
        subjects: {},
        overall: {},
        users: [],
    });
    const sharedLoading = ref(true);

    const rankedUsers = computed(() => {
        return Object.entries(sharedProgress.overall)
            .map(([userId, progress]) => ({ userId, done: progress[0], total: progress[1] })).sort((a, b) => b.done / b.total - a.done / a.total)
            .map(({ userId, done, total }, index) => ({
                ...sharedProgress.users.find((user) => user.id === userId)!,
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
            sharedLoading.value = false;
        } else {
            console.error(progress.body);
            alert('Failed to fetch progress');
        }
    }

    async function update_progress(progress: ProgressChange) {
        if (!sharedProgress.items[progress.itemId]) {
            sharedProgress.items[progress.itemId] = {};
        }
        if (!sharedProgress.items[progress.itemId][progress.userId]) {
            sharedProgress.items[progress.itemId][progress.userId] = [0, 0];
        }
        if (!sharedProgress.subjects[progress.subjectId]) {
            sharedProgress.subjects[progress.subjectId] = {};
        }
        if (!sharedProgress.subjects[progress.subjectId][progress.userId]) {
            sharedProgress.subjects[progress.subjectId][progress.userId] = [0, 0];
        }
        if (!sharedProgress.overall[progress.userId]) {
            sharedProgress.overall[progress.userId] = [0, 0];
        }
        const originalProgress = sharedProgress.items[progress.itemId][progress.userId];
        const diff = [progress.newProgress[0] - originalProgress[0], progress.newProgress[1] - originalProgress[1]];
        sharedProgress.items[progress.itemId][progress.userId] = progress.newProgress;
        sharedProgress.subjects[progress.subjectId][progress.userId][0] += diff[0];
        sharedProgress.subjects[progress.subjectId][progress.userId][1] += diff[1];
        sharedProgress.overall[progress.userId][0] += diff[0];
        sharedProgress.overall[progress.userId][1] += diff[1];
    }

    nextTick(() => {
        const store = useUserStore();
        store.onChecked(() => {
            refreshProgress();
        });
    });

    return {
        rankedUsers,
        sharedProgress,
        refreshProgress,
        update_progress,
    }
});
