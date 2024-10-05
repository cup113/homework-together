<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import dayjs from 'dayjs';
import type { Item } from '../../types/contract';
import { useDebounce } from '@vueuse/core';
import { useItemsStore } from '@/stores/items';
import { useUserStore } from '@/stores/user';
import { useShareStore } from '@/stores/share';

import MiniEditor from '@/components/MiniEditor.vue';
import ProgressSlider from '@/components/ProgressSlider.vue';
import { Icon } from '@iconify/vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

const props = defineProps<{
    index: number;
    item: Item;
}>();

const itemsStore = useItemsStore();
const userStore = useUserStore();
const shareStore = useShareStore();

const index = computed(() => (props.index + 1).toString().padStart(2, '0'));
const subject = computed(() => itemsStore.subjects.find(s => s.id === props.item.public.subject));
const deadline = computed(() => dayjs(props.item.public.deadline).format("MM/DD HH:mm"));
const progress = ref([props.item.progress * 100]); // TODO this can't be updated from outside
const debouncedProgress = useDebounce(progress, 500);
const sharedProgress = computed(() => {
    const userProgress = Object.entries(shareStore.sharedProgress.items[props.item.publicItem] ?? {})
        .map(([uid, p]) => ({ uid, progress: p[0] / p[1] }));
    if (userProgress.length === 0) {
        return {
            max: undefined,
            maxNames: [],
            avg: undefined,
        };
    }
    const max = Math.max.apply(null, userProgress.map(p => p.progress));
    const maxNames = userProgress.filter(p => p.progress === max)
        .map(p => shareStore.sharedProgress.users.find(u => u.id === p.uid)?.name)
        .filter(name => name !== undefined);
    const avg = userProgress.reduce((acc, cur) => acc + cur.progress, 0) / userProgress.length;
    return {
        max,
        maxName: maxNames.join(', '),
        avg,
    };
});
const description = ref(props.item.public.description);
const userEstimate = ref(props.item.estimateMinutes);
const debouncedUserEstimate = useDebounce(userEstimate, 500);
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
});
const permittedToDeletePublic = computed(() => {
    if (userStore.user.id === props.item.public.author) {
        return true;
    }
    const organization = userStore.organizations.find(o => o.id === props.item.public.organization);
    if (!organization) {
        return false;
    }
    return organization.leader === userStore.user.id || organization.managers.includes(userStore.user.id);
});
const range = computed(() => ({
    all: '全体',
    some: '部分',
    private: '个人',
}[props.item.public.range]));

function updateProgress(value: number) {
    progress.value = [value];
}

watch([debouncedProgress, debouncedUserEstimate], () => {
    itemsStore.updateItem(props.item.id, debouncedProgress.value[0] / 100, debouncedUserEstimate.value);
});
</script>

<template>
    <div class="rounded-lg hover:bg-slate-50 px-3 pt-1 border-t border-slate-300 flex flex-col">
        <div class="flex w-full gap-2 items-center">
            <span class="text-sm font-bold text-slate-500">{{ index }}</span>
            <Badge class="flex flex-row items-center h-6 font-mono">
                <div>{{ subject?.abbr }}</div>
            </Badge>
            <div class="flex-grow">
                <MiniEditor v-model="description" placeholder="请输入公开内容/描述"></MiniEditor>
            </div>
        </div>
        <div class="flex w-full gap-1 items-center mt-1">
            <div class="flex-grow">
                <ProgressSlider v-model="progress" :min="0" :max="100" :step="1" :max-progress="sharedProgress.max"
                    :avg-progress="sharedProgress.avg" :max-name="sharedProgress.maxName">
                </ProgressSlider>
            </div>
            <div class="text-xs text-slate-700 text-center font-mono font-bold w-20">
                {{ progress[0].toFixed(0) }}% -{{ itemsStore.toHumanTime(etaMinutes) }}</div>
            <div>
                <Button class="h-4 px-1 py-1" @click="updateProgress(100)">
                    <Icon icon="charm:square-tick" />
                </Button>
            </div>
        </div>
        <div class="flex gap-1 items-center justify-around">
            <Badge class="h-5" variant="outline">
                <Icon icon="tabler:tag-filled"></Icon> {{ range }}
            </Badge>
            <div class="flex gap-1 items-center text-xs bg-lime-200 rounded-md px-2 py-0.5">
                <Icon icon="icon-park:deadline-sort"></Icon>
                <div>{{ deadline }}</div>
            </div>
            <div class="flex gap-1 items-center text-sm bg-amber-200 rounded-md px-2 py-0.5">
                <Icon icon="hugeicons:estimate-02"></Icon>
                <Popover>
                    <PopoverTrigger>
                        <div
                            class="font-bold border border-amber-500 border-dashed hover:bg-amber-300 active:bg-amber-400 rounded-md px-1">
                            {{ itemsStore.toHumanTime(item.estimateMinutes) }}</div>
                    </PopoverTrigger>
                    <PopoverContent>
                        <div>更改个人预估时间</div>
                        <div class="flex gap-1 items-center">
                            <span>改为</span>
                            <Input type="number" min="0" step="1" v-model="userEstimate" class="w-16 h-7"></Input>
                            <span>分钟</span>
                        </div>
                    </PopoverContent>
                </Popover>
                <div class="text-xs">{{ itemsStore.toHumanTime(item.public.estimateMinutes) }}</div>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger>
                    <Button variant="ghost" class="p-1">
                        <Icon icon="weui:more-filled" class="w-6 h-6" color="purple" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent class="flex flex-col">
                    <DropdownMenuItem>
                        <DropdownMenuLabel class="">
                            <div>归属：{{ organizationName }}</div>
                        </DropdownMenuLabel>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <DropdownMenuLabel class="text-red-500 flex items-center gap-1"
                            @click="itemsStore.deleteItem(item.id, 'user')">
                            <Icon icon="material-symbols:delete-outline" />删除（仅个人）
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                    </DropdownMenuItem>
                    <DropdownMenuItem v-if="permittedToDeletePublic">
                        <DropdownMenuLabel class="text-red-500 flex items-center gap-1"
                            @click="itemsStore.deleteItem(item.publicItem, 'public')">
                            <Icon icon="material-symbols:delete-outline" />删除（全体）
                        </DropdownMenuLabel>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    </div>
</template>
