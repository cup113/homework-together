import { defineStore } from "pinia";
import { nextTick, computed } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { useUserStore } from "./user";
import { useNetworkStore } from './network';
import type { Item, RawPublicItem, RawUserItem, Subject } from '@/../types/contract';

export const useItemsStore = defineStore("items", () => {
    const items = useLocalStorage("HT_items", new Array<Item>());
    const subjects = useLocalStorage("HT_subjects", new Array<Subject>());
    const subjectsSummary = computed(() => {
        const map = new Map(subjects.value.map(subject => [
            subject.id,
            Object.assign({}, subject, { done: 0, total: 0 })
        ]));
        items.value.forEach(item => {
            const subject = map.get(item.public.subject.id);
            if (!subject) {
                console.error(`Subject ${item.public.subject.id} not found`);
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

    async function refreshItems() {
        const networkStore = useNetworkStore();
        const response = await networkStore.client.items.list.query();
        if (response.status === 200) {
            items.value = response.body;
        } else {
            console.error(response.status);
            alert("Failed to fetch items"); // TODO: handle error
        }
    }

    async function refreshSubjects() {
        const networkStore = useNetworkStore();
        const response = await networkStore.client.subjects.list.query();
        if (response.status === 200) {
            subjects.value = response.body;
        } else {
            console.error(response.status);
            alert("Failed to fetch subjects"); // TODO: handle error
        }
    }

    async function updateProgress(item: Item, progress: number) {
        const networkStore = useNetworkStore();
        const response = await networkStore.client.items.update.mutation({
            body: {
                id: item.id,
                progress,
            }
        });
        if (response.status === 200) {
            item.progress = progress;
        } else {
            console.error(response.status);
            alert("Failed to update progress"); // TODO: handle error
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
        } else {
            console.error(response.status);
            alert("Failed to add item"); // TODO: handle error
        }
    }

    nextTick(() => {
        const userStore = useUserStore();
        if (userStore.isLoggedIn) {
            refreshItems();
            refreshSubjects();
        }
    })

    return {
        items,
        subjects,
        subjectsSummary,
        summary,
        addItem,
        refreshItems,
        refreshSubjects,
        updateProgress,
    };
});
