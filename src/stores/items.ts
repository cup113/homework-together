import { defineStore } from "pinia";
import { nextTick } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { useUserStore } from "./user";
import { useNetworkStore } from './network';
import type { Item } from '@/../types/contract';
import type { SubjectsRecord } from "types/pocketbase-types";

export const useItemsStore = defineStore("items", () => {
    const items = useLocalStorage("HT_items", new Array<Item>());
    const subjects = useLocalStorage("HT_subjects", new Array<SubjectsRecord>());

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
        refreshItems,
        refreshSubjects,
        updateProgress,
    };
});
