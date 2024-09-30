import { defineStore } from "pinia";
import { nextTick } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { useUserStore } from "./user";
import { useNetworkStore } from './network';
import type { Item } from '@/../types/contract';

export const useItemsStore = defineStore("items", () => {
    const items = useLocalStorage("HT_items", new Array<Item>());

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

    nextTick(() => {
        const userStore = useUserStore();
        if (userStore.isLoggedIn) {
            refreshItems();
        }
    })

    return {
        items,
        refreshItems,
    };
});
