<script setup lang="ts">
import { computed } from 'vue';
import { useUserStore } from '@/stores/user';
import { useShareStore } from '@/stores/share';
import { useTimeStore } from '@/stores/time';
import dayjs from 'dayjs';

import { Icon } from '@iconify/vue';

defineProps<{
    focusMode?: boolean;
}>();

const shareStore = useShareStore();
const userStore = useUserStore();
const timeStore = useTimeStore();

const workingOnSince = computed(() => {
    const user = shareStore.rankedUsers.find(user => user.id === userStore.user.id);
    if (!user || !user.workingOn) {
        return undefined;
    }
    return user.workingOnSince;
});

const timeDisplay = computed(() => {
    if (!workingOnSince.value) {
        return '-:--:--';
    }
    const seconds = dayjs(timeStore.now).diff(dayjs(workingOnSince.value), 'seconds');
    return timeStore.format_long(seconds);
})

</script>

<template>
    <div class="text-center bg-green-800 text-white font-bold p-4 mb-1 text-[6vw] h-[100vh] rounded-lg" v-if="focusMode">
        <div>{{ timeStore.now.format('HH:mm:ss') }}</div>
        <hr>
        <div>已专注 {{ timeDisplay }}</div>
    </div>
    <div class="text-center text-green-800 font-bold mb-1 text-2xl relative" v-else>
        <div>{{ timeDisplay }}</div>
        <div class="absolute bottom-0 right-0">
            <RouterLink to="/focus">
                <Icon icon="simple-line-icons:size-fullscreen" class="w-5 h-5 p-1 rounded-md hover:bg-blue-100 active:bg-blue-200" />
            </RouterLink>
        </div>
    </div>
</template>