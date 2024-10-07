import { defineStore } from "pinia";
import io from 'socket.io-client';
import { initQueryClient } from '@ts-rest/vue-query'
import contract from '@/../types/contract'
import type { SocketClient } from "@/../types/ws";

import { useUserStore } from "./user";
import { useShareStore } from "./share";
import { nextTick } from "vue";

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

    let socket: SocketClient | null = null;
    let firstConnect = true;

    nextTick(() => {
        const userStore = useUserStore();
        userStore.onChecked(initSocket);
    });

    function initSocket() {
        socket = io({
            extraHeaders: {
                'Authorization': `Bearer ${useUserStore().token}`
            }
        });

        socket.on('connect', () => {
            console.log('Connected to server');
            if (!firstConnect) {
                setTimeout(() => location.reload(), 2000);
            }
            firstConnect = false;
        });

        socket.on('disconnect', (reason) => {
            console.log('Disconnected from server');
            if (reason === 'io server disconnect') {
                alert('Server disconnected.');
            } else if (reason === 'ping timeout' || reason === 'transport close' || reason === 'transport error') {
                console.log(`Reason: ${reason}`);
            }
        });

        socket.on('connect_error', error => {
            console.error('Failed to connect to server', error);
        });

        socket.on('refresh', (except) => {
            const userStore = useUserStore();
            if (userStore.user.id === except) {
                return;
            }
            setTimeout(() => location.reload(), 600);
        });

        socket.on('progressUpdated', data => {
            const shareStore = useShareStore();
            shareStore.update_progress(data);
        });
    }

    return {
        client,
    }
});
