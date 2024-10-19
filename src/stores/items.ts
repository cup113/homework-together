import { defineStore } from "pinia";
import { nextTick, computed, ref } from "vue";
import { useUserStore } from "./user";
import { useNetworkStore } from './network';
import { useShareStore } from "./share";
import { useNow } from "@vueuse/core";
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
    const latestDeleteTime = ref(dayjs().subtract(1, 'hour'));

    function toHumanTime(minutes: number) {
        const h = Math.floor(minutes / 60);
        const m = (minutes % 60).toFixed(0).padStart(2, '0');
        return `${h}:${m}`;
    }

    function convertSnapPoints(original: string) {
        // Example: 3*2+1 -> [3, 3, 1]
        const units = original.replace(/\s/g, '').split('+');
        const points = [];
        for (const unit of units) {
            const splitted = unit.split('*');
            const num = parseInt(splitted[0]);
            if (splitted.length === 2) {
                const times = parseInt(splitted[1]);
                for (let i = 0; i < times; i++) {
                    points.push(num);
                }
            } else {
                points.push(num);
            }
        }

        let acc = 0;
        const result = new Array<number>();
        const appeared = new Set<string>();
        points.forEach(point => {
            acc += point;
            result.push(acc);
        });
        return result.map(point => (point / acc * 100).toFixed(0)).filter(point => {
            if (appeared.has(point)) {
                return false;
            }
            appeared.add(point);
            return true;
        }).join(',');
    }

    const now = useNow({ interval: 1000 });

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

    async function deleteItems(ids: string[], type: 'public' | 'user') {
        if (dayjs().diff(latestDeleteTime.value, 'minutes') > 1) {
            const text = `你确定要删除此项目(ID: ${ids.join(', ')})吗？` + (type === 'public' ? '所有人的进度都会被删除。' : '');
            if (!confirm(text)) {
                return;
            }
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
                    latestDeleteTime.value = dayjs();
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
        await deleteItems(outdatedItems.map(item => (type === 'public' ? item.publicItem : item.id)), type);
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
        now,
        items,
        itemsLoading,
        itemsSorted,
        subjects,
        subjectsSummary,
        summary,
        toHumanTime,
        convertSnapPoints,
        addItem,
        deleteItems,
        deleteOutdated,
        refreshItems,
        refreshSubjects,
        updateItem,
    };
});
