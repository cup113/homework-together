<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import dayjs from 'dayjs';
import type { Item } from '../../types/contract';
import { useDebounce, useVModel } from '@vueuse/core';
import { useItemsStore } from '@/stores/items';

import MiniEditor from '@/components/MiniEditor.vue';
import { Icon } from '@iconify/vue';
import { Slider } from '@/components/ui/slider';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const props = defineProps<{
    item: Item;
}>();

const item = useVModel(props, 'item');
const deadline = computed(() => dayjs(props.item.public.deadline).format("MM/DD HH:mm"));
const progress = ref([props.item.progress * 100]);
const debouncedProgress = useDebounce(progress, 500);
const description = ref(props.item.public.description);
const range = computed(() => ({
    all: '全体',
    some: '部分',
    private: '个人',
}[item.value.public.range]))

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
    <Card>
        <CardHeader>
            <div class="flex flex-row gap-1 items-center">
                <MiniEditor v-model="description">公开内容/描述</MiniEditor>
                <MiniEditor v-model="item.note">备注</MiniEditor>
                <Badge>
                    <Icon icon="tabler:tag-filled"></Icon> {{ range }}
                </Badge>
            </div>
        </CardHeader>
        <CardContent>
            <div class="flex items-center gap-2">
                <Badge class="flex flex-row gap-1">
                    <Icon icon="ph:exam"></Icon>
                    <div>{{ item.public.subject.abbr }}</div>
                    <div>{{ item.public.subject.name }}</div>
                </Badge>
                <Badge class="flex gap-1">
                    <Icon icon="hugeicons:estimate-02"></Icon>
                    <div>{{ toHumanTime(item.estimateMinutes) }}</div>
                    <div><del>{{ toHumanTime(item.public.estimateMinutes) }}</del></div>
                </Badge>
                <Badge class="flex gap-1">
                    <Icon icon="icon-park:deadline-sort"></Icon>
                    <div>{{ deadline }}</div>
                </Badge>
            </div>
            <div class="flex flex-row gap-3 mt-4">
                <Slider v-model="progress" :min="0" :max="100" :step="1"></Slider>
                <div class="flex gap-1">
                    <Button v-for="progress in SHORTCUT_PROGRESSES" :key="progress" @click="updateProgress(progress)"
                        class="px-3 py-1">{{
                            progress }}%</Button>
                </div>
            </div>
        </CardContent>
        <CardFooter>
            <Button variant="destructive">删除</Button>
        </CardFooter>
    </Card>
</template>
