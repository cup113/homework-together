<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import dayjs from 'dayjs';
import type { Item } from '../../types/contract';
import { useDebounce, useVModel } from '@vueuse/core';
import { useItemsStore } from '@/stores/items';

import MiniEditor from '@/components/MiniEditor.vue';
import { Slider } from '@/components/ui/slider';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button';

const props = defineProps<{
    item: Item;
}>();

const item = useVModel(props, 'item');
const deadline = computed(() => dayjs(props.item.public.deadline).format("MM/DD HH:mm"));
const progress = ref([props.item.progress * 100]);
const debouncedProgress = useDebounce(progress, 500);
const description = ref(props.item.public.description);

function toHumanTime(minutes: number) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) {
        return `${h}h ${m}m`;
    } else {
        return `${m}min`;
    }
}

function updateProgress(value: number) {
    progress.value = [value];
}

watch(debouncedProgress, value => {
    const itemsStore = useItemsStore();
    itemsStore.updateProgress(props.item, value[0] / 100);
});

const SHORTCUT_PROGRESSES = [0, 50, 100];

</script>

<template>
    <TableRow>
        <TableCell>{{ item.public.subject.abbr }}</TableCell>
        <TableCell>
            <div class="flex flex-col gap-1">
                <MiniEditor v-model="description">公开内容/描述</MiniEditor>
                <MiniEditor v-model="item.note">备注</MiniEditor>
            </div>
        </TableCell>
        <TableCell>
            <div class="flex flex-col gap-3">
                <Slider v-model="progress" :min="0" :max="100" :step="1"></Slider>
                <div class="flex gap-1">
                    <Button v-for="progress in SHORTCUT_PROGRESSES" :key="progress" @click="updateProgress(progress)"
                        class="px-3 py-1">{{
                            progress }}%</Button>
                </div>
            </div>
        </TableCell>
        <TableCell>
            <Badge>{{ item.public.range }}</Badge>
        </TableCell>
        <TableCell>
            <div>{{ toHumanTime(item.estimateMinutes) }}</div>
            <div><del>{{ toHumanTime(item.public.estimateMinutes) }}</del></div>
        </TableCell>
        <TableCell>{{ deadline }}</TableCell>
        <TableCell><Button variant="destructive">删除</Button></TableCell>
    </TableRow>
</template>
