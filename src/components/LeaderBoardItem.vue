<script setup lang="ts">
import { computed } from 'vue';
import dayjs from 'dayjs';
import { useItemsStore } from '@/stores/items';
import { useTimeStore } from '@/stores/time';
import { useUserStore } from '@/stores/user';

import type { UsersResponse } from '../../types/pocketbase-types';
import ProgressSlider from './ProgressSlider.vue';
import MiniEditor from './MiniEditor.vue';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

const props = defineProps<{
    rank: number;
    name: string;
    user: UsersResponse & { done: number, total: number };
}>();

const itemsStore = useItemsStore();
const timeStore = useTimeStore();
const userStore = useUserStore();

const rankString = computed(() => {
    const rank = props.rank.toString().padStart(2, '0');
    return `#${rank}`;
});

const rankClass = computed(() => {
    if (props.rank <= 3) {
        return {
            1: ['text-yellow-600', 'font-bold', 'text-lg'],
            2: ['text-zinc-600', 'font-bold', 'text-lg'],
            3: ['text-amber-600', 'font-bold', 'text-lg'],
        }[props.rank];
    }
    return ['text-slate-600'];
});

const percentage = computed(() => (props.user.done / props.user.total * 100).toFixed(2));

const minutesSinceLastActive = computed(() => {
    if (!props.user.lastActive) {
        return 0;
    }
    const lastActive = dayjs(props.user.lastActive);
    return dayjs(timeStore.now).diff(dayjs(lastActive), 'minutes');
});

const timeSinceLastActive = computed(() => {
    const minutes = minutesSinceLastActive.value;
    if (minutes <= 99) {
        return `${minutes} 分钟`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours <= 99) {
        return `${hours} 小时`;
    }
    const days = Math.floor(hours / 24);
    return `${days} 天`;
});

const workingDescription = computed(() => {
    if (!props.user.workingOn) {
        return undefined;
    }
    const lastingMinutes = dayjs().diff(dayjs(props.user.workingOnSince), 'minutes');
    const itemHTML = itemsStore.items.find(item => item.publicItem === props.user.workingOn)?.public?.description ?? '<p><i>未知项目</i></p>';

    return {
        lastingMinutes,
        itemHTML,
    };
});

const animation = computed(() => {
    if (!props.user.workingOn) {
        return undefined;
    }
    return {
        duration: 3000,
        stressed: props.user.id === userStore.userBasic.id,
    };
});

const modelValue = computed({
    get() { return [props.user.done / props.user.total * 100]; },
    set() { },
});

const modelValueText = computed({
    get() { return workingDescription.value?.itemHTML ?? ''; },
    set() { },
});
</script>

<template>
    <div class="flex items-center px-2 py-2 border-b border-slate-200 rounded-lg gap-3 w-48">
        <div :class="rankClass">{{ rankString }}</div>
        <div class="flex flex-col items-center grow">
            <div class="w-full">
                <ProgressSlider disabled v-model="modelValue" :min="0" :max="100" :animation="animation"></ProgressSlider>
            </div>
            <div class="flex items-center justify-between w-full">
                <Popover>
                    <PopoverTrigger>
                        <span class="hover:bg-slate-200 active:bg-slate-300 px-1 rounded-lg">{{ name }}</span>
                    </PopoverTrigger>
                    <PopoverContent>
                        <div>最近活跃: <b>{{ timeSinceLastActive }}</b>前</div>
                        <div v-if="workingDescription">
                            <div>已持续进行项目 <b>{{ workingDescription.lastingMinutes }}</b> 分钟:</div>
                            <MiniEditor v-model="modelValueText" disabled placeholder="项目描述"></MiniEditor>
                        </div>
                    </PopoverContent>
                </Popover>
                <span class="text-slate-500 text-sm">{{ percentage }}%</span>
            </div>
        </div>
    </div>
</template>
