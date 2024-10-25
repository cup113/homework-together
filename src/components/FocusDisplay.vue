<script setup lang="ts">
import { computed } from 'vue';
import { useUserStore } from '@/stores/user';
import { useShareStore } from '@/stores/share';
import { useTimeStore } from '@/stores/time';
import dayjs from 'dayjs';

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
        return '--:--';
    }
    const seconds = dayjs(timeStore.now).diff(dayjs(workingOnSince.value), 'seconds');
    return timeStore.format_long(seconds);
})

</script>

<template>
    <div v-show="workingOnSince" class="text-center text-green-800 font-bold mb-1">
        {{ timeDisplay }}
    </div>
</template>