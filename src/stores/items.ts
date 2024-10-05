import { defineStore } from "pinia";
import { nextTick, computed, ref } from "vue";
import { useUserStore } from "./user";
import { useNetworkStore } from './network';
import { useShareStore } from "./share";
import type { Item, RawPublicItem, RawUserItem, Subject } from '@/../types/contract';
import dayjs from "dayjs";

export const useItemsStore = defineStore("items", () => {
    const items = ref(new Array<Item>());
    const subjects = ref(new Array<Subject>());
    const subjectsSummary = computed(() => {
        const map = new Map(subjects.value.map(subject => [
            subject.id,
            Object.assign({}, subject, { done: 0, total: 0 })
        ]));
        items.value.forEach(item => {
            const subject = map.get(item.public.subject);
            if (!subject) {
                console.error(`Subject ${item.public.subject} not found`);
                return;
            }
            subject.done += item.progress * item.estimateMinutes;
            subject.total += item.estimateMinutes;
        });
        subjects.value.forEach(subject => {
            if (map.get(subject.id)?.total === 0) {
                map.delete(subject.id);
            }
        })
        return map;
    });
    const summary = computed(() => {
        let total = 0;
        let done = 0;
        subjectsSummary.value.forEach(subject => {
            total += subject.total;
            done += subject.done;
        });
        return { total, done };
    });
    const itemsSorted = computed(() => {
        return items.value.map(item => ({
            ...item,
            subject: subjects.value.find(subject => subject.id === item.public.subject)!,
        })).sort((a, b) => {
            if (a.subject !== b.subject) {
                return a.subject.abbr.localeCompare(b.subject.abbr);
            }
            if (a.public.deadline !== b.public.deadline) {
                return (b.public.deadline ?? "").localeCompare(a.public.deadline ?? "");
            }
            return a.public.description.localeCompare(b.public.description);
        });
    });
    const latestDeleteTime = ref(dayjs().subtract(1, 'hour'));

    function toHumanTime(minutes: number) {
        const h = Math.floor(minutes / 60);
        const m = (minutes % 60).toFixed(0).padStart(2, '0');
        return `${h}:${m}`;
    }

    async function refreshItems() {
        const networkStore = useNetworkStore();
        await refreshSubjects();
        const response = await networkStore.client.items.list.query();
        if (response.status === 200) {
            items.value = response.body
        } else {
            console.error(response.status);
            alert("Failed to fetch items");
        }
    }

    async function refreshSubjects() {
        const networkStore = useNetworkStore();
        const response = await networkStore.client.subjects.list.query();
        if (response.status === 200) {
            subjects.value = response.body;
        } else {
            console.error(response.status);
            alert("Failed to fetch subjects");
        }
    }

    async function updateItem(itemId: string, progress: number, userEstimate: number) {
        const networkStore = useNetworkStore();
        const response = await networkStore.client.items.update.mutation({
            body: {
                userItem: {
                    id: itemId,
                    progress,
                    estimateMinutes: userEstimate,
                },
            }
        });
        if (response.status === 200) {
            const item = items.value.find(item => item.id === itemId);
            if (!item) {
                console.error(`Item ${itemId} not found`);
                return;
            }
            item.progress = progress;
            item.estimateMinutes = userEstimate;
            const shareStore = useShareStore();
            shareStore.refreshProgress();
        } else {
            console.error(response.status);
            alert("Failed to update progress");
        }
    }

    async function addItem(publicItem: RawPublicItem, userItem: RawUserItem) {
        const networkStore = useNetworkStore();
        const response = await networkStore.client.items.create.mutation({
            body: {
                publicItem,
                userItem,
            }
        });
        if (response.status === 200) {
            items.value.push(response.body);
                        const shareStore = useShareStore();
            shareStore.refreshProgress();
        } else {
            console.error(response.status);
            alert("Failed to add item");
        }
    }

    async function deleteItem(itemId: string, type: 'public' | 'user') {
        if (dayjs().diff(latestDeleteTime.value, 'minutes') > 1) {
            const text = `你确定要删除此项目(ID: ${itemId})吗？` + (type === 'public' ? '所有人的进度都会被删除。' : '');
            if (!confirm(text)) {
                return;
            }
        }
        const network = useNetworkStore();
        const response = await network.client.items.delete.mutation({
            body: {
                id: itemId,
                type,
            }
        });
        if (response.status === 200) {
            const index = items.value.findIndex(item => (type === 'public' ? item.publicItem === itemId : item.id === itemId));
            if (index >= 0) {
                items.value.splice(index, 1);
                latestDeleteTime.value = dayjs();
            } else {
                console.error(`Item ${itemId} not found`);
            }
        } else {
            console.error(response.status);
            alert("Failed to delete item");
        }
    }

    nextTick(() => {
        const userStore = useUserStore();
        userStore.onChecked(() => {
            if (userStore.isLoggedIn) {
                refreshItems();
            }
        });
    });

    return {
        items,
        itemsSorted,
        subjects,
        subjectsSummary,
        summary,
        toHumanTime,
        addItem,
        deleteItem,
        refreshItems,
        refreshSubjects,
        updateItem,
    };
});
