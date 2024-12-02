import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";
import io from 'socket.io-client';
import { initQueryClient } from '@ts-rest/vue-query'
import contract from '@/../types/contract'
import type { SocketClient } from "@/../types/ws";

import { ref, nextTick } from "vue";
import { useUserStore } from "./user";
import { useShareStore } from "./share";
import { useItemsStore } from "./items";

export const useNetworkStore = defineStore("network", () => {
    const buildVersion = useLocalStorage('HT_BUILD_VERSION', 'unknown');
    const receivedInfo = ref(false);
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
        });

        socket.on('disconnect', (reason) => {
            console.log('Disconnected from server');
            if (reason === 'io server disconnect' || reason === 'parse error') {
                console.error(reason);
            } else if (reason === 'ping timeout' || reason === 'transport close' || reason === 'transport error') {
                console.log(`Reason: ${reason}`);
            }
            const userStore = useUserStore();
            userStore.onlineUserIds.splice(0, userStore.onlineUserIds.length);
        });

        socket.on('connect_error', error => {
            console.error('Failed to connect to server', error);
        });

        socket.on('refresh', (except, sources) => {
            const userStore = useUserStore();
            if (userStore.userBasic.id === except) {
                return;
            }
            sources.forEach(source => {
                const funcMap = {
                    items() {
                        const itemsStore = useItemsStore();
                        itemsStore.refreshItems();
                    },
                    share() {
                        const shareStore = useShareStore();
                        shareStore.refreshProgress();
                    },
                } satisfies Required<Record<typeof source, () => void>>;
                funcMap[source]();
            })
        });

        socket.on('info', version => {
            if (buildVersion.value === 'unknown' || version !== buildVersion.value) {
                buildVersion.value = version;
                if (receivedInfo.value) {
                    setTimeout(() => location.reload(), 600);
                }
            }
            receivedInfo.value = true;
        });

        socket.on('progressUpdated', data => {
            const shareStore = useShareStore();
            shareStore.update_progress(data);
        });

        socket.on('userUpdated', user => {
            const shareStore = useShareStore();
            const { id, ...userDiff } = user;
            Object.entries(shareStore.sharedProgress).forEach(([, progress]) => {
                const index = progress.users.findIndex(user => user.id === id);
                if (index === -1) {
                    return;
                }
                Object.assign(progress.users[index], userDiff);
                if (id === useUserStore().userBasic.id) {
                    const userStore = useUserStore();
                    if (userStore.user) {
                        Object.assign(userStore.user, userDiff);
                    }
                }
            });
        });

        socket.on('usersJoined', userIds => {
            const userStore = useUserStore();
            userIds.forEach(userId => {
                userStore.onlineUserIds.push(userId);
            });
        });

        socket.on('usersLeft', userIds => {
            const userStore = useUserStore();
            userIds.forEach(userId => {
                const index = userStore.onlineUserIds.indexOf(userId);
                if (index === -1) {
                    return;
                }
                userStore.onlineUserIds.splice(index, 1);
            });
        });
    }

    return {
        buildVersion,
        client,
    }
});
