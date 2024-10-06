import { defineStore } from "pinia";
import io from 'socket.io-client';
import { initQueryClient } from '@ts-rest/vue-query'
import contract from '@/../types/contract'
import type { SocketClient } from "@/../types/ws";

import { useUserStore } from "./user";
import { useShareStore } from "./share";

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

    const socket: SocketClient = io({
        extraHeaders: {
            'Authorization': `Bearer ${useUserStore().token}`, // TODO: use token from user store
        }
    });

    socket.on('connect', () => {
        console.log('Connected to server');
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        setTimeout(() => {
            location.reload();
        }, 1000 * 100);
    });

    socket.on('connect_error', error => {
        console.error('Failed to connect to server', error);
        alert('Failed to connect to server');
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
    })

    return {
        client,
    }
});
