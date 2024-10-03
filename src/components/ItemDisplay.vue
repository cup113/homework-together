<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import dayjs from 'dayjs';
import type { Item } from '../../types/contract';
import { useDebounce, useVModel } from '@vueuse/core';
import { useItemsStore } from '@/stores/items';
import { useUserStore } from '@/stores/user';

import MiniEditor from '@/components/MiniEditor.vue';
import { Icon } from '@iconify/vue';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from './ui/dropdown-menu';

const props = defineProps<{
    item: Item;
}>();

const itemsStore = useItemsStore();
const userStore = useUserStore();
const item = useVModel(props, 'item');

const deadline = computed(() => dayjs(props.item.public.deadline).format("MM/DD HH:mm"));
const progress = ref([props.item.progress * 100]);
const debouncedProgress = useDebounce(progress, 500);
const description = ref(props.item.public.description);
const etaMinutes = computed(() => (100 - progress.value[0]) * props.item.estimateMinutes / 100);
const organizationName = computed(() => {
    if (!props.item.public.organization) {
        return '个人';
    }
    const organization = userStore.organizations.find(o => o.id === props.item.public.organization);
    if (!organization) {
        return '未知';
    }
    return organization.name;
}); // TODO organization name / abbreviation
const range = computed(() => ({
    all: '全体',
    some: '部分',
    private: '个人',
}[item.value.public.range]));
const isAuthor = computed(() => item.value.public.author === userStore.user.id);

function updateProgress(value: number) {
    progress.value = [value];
}

watch(debouncedProgress, value => {
    itemsStore.updateProgress(props.item, value[0] / 100);
});

const SHORTCUT_PROGRESSES = [100, 75, 50, 25, 0];
</script>

<template>
    <div class="rounded-lg hover:bg-slate-50 px-2">
        <div class="flex flex-row gap-1 items-center">
            <DropdownMenu>
                <DropdownMenuTrigger>
                    <Button variant="ghost" class="p-1">
                        <Icon icon="weui:more-filled" class="w-6 h-6" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent class="flex flex-col">
                    <DropdownMenuItem v-for="progress in SHORTCUT_PROGRESSES" :key="progress"
                        @click="updateProgress(progress)">
                        <DropdownMenuLabel class="flex gap-1 items-center">
                            <Icon icon="pajamas:progress" />
                            {{ progress }}%
                        </DropdownMenuLabel>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <DropdownMenuLabel class="text-red-500 flex items-center gap-1">
                            <Icon icon="material-symbols:delete-outline" />删除（仅个人） <!-- TODO: Confirmation -->
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                    </DropdownMenuItem>
                    <DropdownMenuItem v-if="isAuthor">
                        <DropdownMenuLabel class="text-red-500 flex items-center gap-1">
                            <Icon icon="material-symbols:delete-outline" />删除（全体） <!-- TODO: Confirmation -->
                        </DropdownMenuLabel>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <div class="w-24 flex flex-col gap-1">
                <div>
                    <Slider v-model="progress" :min="0" :max="100" :step="1"></Slider>
                </div>
                <div class="text-sm text-slate-700 text-center">{{ progress[0] }}% -{{
                    itemsStore.toHumanTime(etaMinutes) }}</div>
            </div>
            <div class="flex flex-col w-96">
                <div class="flex gap-1 items-center">
                    <Badge v-if="organizationName" variant="secondary" class="flex flex-row items-center h-6">
                        <div>{{ organizationName }}</div>
                    </Badge>
                    <Badge class="flex flex-row items-center h-6 font-mono">
                        <div>{{ item.public.subject.abbr }}</div>
                    </Badge>
                    <MiniEditor v-model="description" placeholder="请输入公开内容/描述"></MiniEditor>
                </div>
                <hr>
                <div class="flex items-center gap-1">
                    <Badge class="h-5" variant="outline">
                        <Icon icon="tabler:tag-filled"></Icon> {{ range }}
                    </Badge>
                    <div class="flex gap-1 items-center text-xs bg-lime-200 rounded-md px-2 py-0.5">
                        <Icon icon="icon-park:deadline-sort"></Icon>
                        <div>{{ deadline }}</div>
                    </div>
                    <MiniEditor v-model="item.note" class="text-slate-500 text-xs" placeholder="添加备注"></MiniEditor>
                </div>
            </div>
            <div class="flex gap-1 items-center text-sm bg-amber-200 rounded-md px-2 py-1">
                <Icon icon="hugeicons:estimate-02"></Icon>
                <div class="font-bold">{{ itemsStore.toHumanTime(item.estimateMinutes) }}</div>
                <div class="text-xs">{{ itemsStore.toHumanTime(item.public.estimateMinutes) }}</div>
            </div>
        </div>
    </div>
</template>
