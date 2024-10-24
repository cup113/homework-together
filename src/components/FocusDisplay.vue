<script setup lang="ts">
import { computed } from 'vue';
import { useUserStore } from '@/stores/user';
import { useShareStore } from '@/stores/share';
import { useItemsStore } from '@/stores/items';
import dayjs from 'dayjs';

const shareStore = useShareStore();
const itemsStore = useItemsStore();
const userStore = useUserStore();

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
    let seconds = dayjs(itemsStore.now).diff(dayjs(workingOnSince.value), 'seconds');
    let minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    let hours = Math.floor(minutes / 60);
    minutes = minutes % 60;
    return `${hours.toString()}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
})

</script>

<template>
    <div v-show="workingOnSince" class="text-center text-green-800 font-bold mb-1">
        {{ timeDisplay }}
    </div>
</template>