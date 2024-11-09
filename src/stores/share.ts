import { defineStore } from 'pinia';
import { ref, reactive, computed, nextTick } from 'vue';
import { useNetworkStore } from './network';
import { useUserStore } from './user';
import type { SharedProgress } from '@/../types/contract';
import type { ProgressChange } from '@/../types/ws';
import type { UsersResponse } from 'types/pocketbase-types';

export const useShareStore = defineStore('share', () => {
    const sharedProgress = reactive<Record<string, SharedProgress>>({});
    const sharedLoading = ref(true);

    const subjectProgress = computed(() => {
        const result: Record<string, Record<string, UsersResponse & { done: number, total: number }>> = {};

        Object.entries(sharedProgress).forEach(([organizationId, orgProgress]) => Object.entries(orgProgress.subjects).forEach(([subjectId, progress]) => {
            result[subjectId] ??= {};
            Object.entries(progress).forEach(([userId, [done, total]]) => {
                const user = orgProgress.users.find(user => user.id === userId);
                if (!user) {
                    console.warn(`User ${userId} not found in organization ${organizationId}`);
                    return;
                }
                result[subjectId][userId] ??= { ...user, done: 0, total: 0 };
                result[subjectId][userId].done += done;
                result[subjectId][userId].total += total;
            });
        }));

        return result;
    });

    async function refreshProgress(organizations?: string[]) {
        const network = useNetworkStore();
        const userStore = useUserStore();
        const progress = await network.client.organizations.progress.mutation({
            body: {
                organizations: organizations ?? userStore.user!.organizations.map(org => org.id),
            }
        });
        if (progress.status === 200) {
            Object.entries(progress.body).forEach(([organizationId, orgProgress]) => {
                sharedProgress[organizationId] = orgProgress;
            });
            sharedLoading.value = false;
        } else {
            console.error(progress.body);
            alert('Failed to fetch progress');
        }
    }

    async function update_progress(progress: ProgressChange) {
        sharedProgress[progress.organizationId] ??= {
            users: [],
            items: {},
            subjects: {},
            overall: {},
        };
        const orgProgress = sharedProgress[progress.organizationId];
        orgProgress.items[progress.itemId] ??= {};
        orgProgress.items[progress.itemId][progress.userId] ??= [0, 0];
        orgProgress.subjects[progress.subjectId] ??= {};
        orgProgress.subjects[progress.subjectId][progress.userId] ??= [0, 0];
        orgProgress.overall[progress.userId] ??= [0, 0];

        const originalProgress = orgProgress.items[progress.itemId][progress.userId];
        const diff = [progress.newProgress[0] - originalProgress[0], progress.newProgress[1] - originalProgress[1]];
        orgProgress.items[progress.itemId][progress.userId] = progress.newProgress;
        orgProgress.subjects[progress.subjectId][progress.userId][0] += diff[0];
        orgProgress.subjects[progress.subjectId][progress.userId][1] += diff[1];
        orgProgress.overall[progress.userId][0] += diff[0];
        orgProgress.overall[progress.userId][1] += diff[1];
    }

    nextTick(() => {
        const store = useUserStore();
        store.onChecked(() => {
            refreshProgress();
        });
    });

    return {
        sharedProgress,
        subjectProgress,
        refreshProgress,
        update_progress,
    }
});
