import { defineStore } from "pinia";
import { nextTick, computed, ref, reactive } from "vue";
import { useUserStore } from "./user";
import { useNetworkStore } from './network';
import { useShareStore } from "./share";
import { convertSnapPoints } from "@/lib/snap-points";
import type { Item, ItemsUpdate, RawPublicItem, RawUserItem, Subject } from '@/../types/contract';
import dayjs from "dayjs";

export const useItemsStore = defineStore("items", () => {
    const items = ref(new Array<Item>());
    const subjects = ref(new Array<Subject>());
    const itemsLoading = ref(true);
    const subjectsSummary = computed(() => {
        const map = new Map(subjects.value.map(subject => [
            subject.id,
            Object.assign({}, subject, { done: 0, total: 0 })
        ]));
        items.value.filter(item => item.confirmed).forEach(item => {
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
    const askingDelete = ref(false);
    const askingDeleteParams = reactive({
        items: new Array<Item>(),
        type: 'public' as 'public' | 'user',
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
                return (a.public.deadline ?? "").localeCompare(b.public.deadline ?? "");
            }
            return a.public.description.localeCompare(b.public.description);
        });
    });
    const subjectColors = computed(() => {
        const VIBRANT_COLORS = ['#c2410c', '#a16207', '#4d7c0f', '#0f766e', '#0369a1', '#5b21b8'];
        let index = 0;
        const colors = new Map<string, string>();
        itemsSorted.value.forEach(item => {
            const color = colors.get(item.subject.id);
            if (!color) {
                colors.set(item.subject.id, VIBRANT_COLORS[index]);
                index = (index + 1) % VIBRANT_COLORS.length;
            }
        });
        return colors;
    })

    async function refreshItems() {
        const network = useNetworkStore();
        await refreshSubjects();
        const response = await network.client.items.list.query();
        if (response.status === 200) {
            items.value = response.body;
            itemsLoading.value = false;
        } else {
            console.error(response.status);
            alert("Failed to fetch items");
        }
    }

    async function refreshSubjects() {
        const network = useNetworkStore();
        const response = await network.client.subjects.list.query();
        if (response.status === 200) {
            subjects.value = response.body;
        } else {
            console.error(response.status);
            alert("Failed to fetch subjects");
        }
    }

    async function updateItem(item: ItemsUpdate) {
        const network = useNetworkStore();
        const response = await network.client.items.update.mutation({
            body: item,
        });
        if (response.status === 200) {
            const userItem = item.userItem;
            const publicItem = item.publicItem;
            if (userItem) {
                const index = items.value.findIndex(i => i.id === userItem.id);
                if (index >= 0) {
                    if (userItem.progress !== undefined) {
                        items.value[index].progress = userItem.progress;
                    }
                    if (userItem.estimateMinutes !== undefined) {
                        items.value[index].estimateMinutes = userItem.estimateMinutes;
                    }
                    if (userItem.confirmed !== undefined) {
                        items.value[index].confirmed = userItem.confirmed;
                    }
                } else {
                    console.error(`Item ${userItem.id} not found`);
                }
            }
            if (publicItem) {
                const index = items.value.findIndex(i => i.publicItem === publicItem.id);
                if (index >= 0) {
                    if (publicItem.description !== undefined) {
                        items.value[index].public.description = publicItem.description;
                    }
                    if (publicItem.deadline !== undefined) {
                        items.value[index].public.deadline = publicItem.deadline;
                    }
                } else {
                    console.error(`Item ${publicItem.id} not found`);
                }
            }
        } else {
            console.error(response.status);
            alert("Failed to update progress");
        }
    }

    async function addItem(publicItem: RawPublicItem, userItem: RawUserItem) {
        const network = useNetworkStore();
        const response = await network.client.items.create.mutation({
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

    async function deleteItems(ids: string[], type: 'public' | 'user', skipAsk: boolean) {
        if (!skipAsk) {
            askingDelete.value = true;
            askingDeleteParams.items = items.value.filter(item => ids.includes((type === 'public' ? item.publicItem : item.id)));
            askingDeleteParams.type = type;
            return;
        }
        const network = useNetworkStore();
        const response = await network.client.items.delete.mutation({
            body: {
                ids: ids,
                type,
            }
        });
        if (response.status === 200) {
            ids.forEach(itemId => {
                const index = items.value.findIndex(item => (type === 'public' ? item.publicItem : item.id) === itemId);
                if (index >= 0) {
                    items.value.splice(index, 1);
                    const shareStore = useShareStore();
                    shareStore.refreshProgress();
                } else {
                    console.error(`Item ${itemId} not found`);
                }
            });
        } else {
            console.error(response.status);
            alert("Failed to delete item");
        }
    }

    async function deleteOutdated(type: 'public' | 'user') {
        const outdatedItems = items.value.filter(item => {
            const deadline = item.public.deadline;
            if (!deadline) { return false; }
            return dayjs().isAfter(dayjs(deadline));
        });
        await deleteItems(outdatedItems.map(item => (type === 'public' ? item.publicItem : item.id)), type, false);
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
        itemsLoading,
        itemsSorted,
        askingDelete,
        askingDeleteParams,
        subjects,
        subjectColors,
        subjectsSummary,
        summary,
        convertSnapPoints,
        addItem,
        deleteItems,
        deleteOutdated,
        refreshItems,
        refreshSubjects,
        updateItem,
    };
});
