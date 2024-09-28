import { defineStore } from "pinia";
import { initQueryClient } from '@ts-rest/vue-query'
import contract from '@/../types/contract'

import { useUserStore } from "./user";

export const useNetworkStore = defineStore("network", () => {
    const client = initQueryClient(contract, {
        baseUrl: location.origin,
        baseHeaders: {
            'Authorization': () => {
                const userStore = useUserStore();
                return `Bearer ${userStore.token}`;
            }
        },
        jsonQuery: true,
    });

    return {
        client,
    }
});
