<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import dayjs from 'dayjs';
import type { Item, ItemsUpdate } from '../../types/contract';
import { useDebounceFn } from '@vueuse/core';
import { useItemsStore } from '@/stores/items';
import { useUserStore } from '@/stores/user';
import { useShareStore } from '@/stores/share';
import { cloneDeep } from 'es-toolkit/object';

import MiniEditor from '@/components/MiniEditor.vue';
import ProgressSlider from '@/components/ProgressSlider.vue';
import { Icon } from '@iconify/vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog';

const props = defineProps<{
    index: number;
    item: Item;
}>();

const itemsStore = useItemsStore();
const userStore = useUserStore();
const shareStore = useShareStore();

const source = computed(() => {
    return {
        index: (props.index + 1).toString().padStart(2, '0'),
        subject: itemsStore.subjects.find(s => s.id === props.item.public.subject),
        deadline: props.item.public.deadline ? dayjs(props.item.public.deadline).format("MM/DD HH:mm") : undefined,
        range: ({
            all: '全体',
            some: '部分',
            private: '个人',
        }[props.item.public.range]),
    };
});
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

const urgency = computed(() => {
    if (props.item.public.deadline === undefined) {
        return 0;
    }
    const diff = dayjs(props.item.public.deadline).diff(dayjs(), 'days');
    return 1 / (1 + Math.exp((diff - 0.5) / 2));
});

const color = computed(() => {
    const leastUrgentColor = [0, 179, 80];
    const mostUrgentColor = [255, 0, 0];

    const color = [0, 1, 2].map(i => leastUrgentColor[i] + (mostUrgentColor[i] - leastUrgentColor[i]) * urgency.value).map(v => v.toFixed(0));

    return `rgb(${color.join(',')})`;
});

const cache = reactive({
    progress: [props.item.progress * 100],
    deadline: props.item.public.deadline ? dayjs(props.item.public.deadline).format("YYYY-MM-DD" + "T" + "HH:mm") : undefined,
    description: props.item.public.description,
    userEstimate: props.item.estimateMinutes,
    confirmed: props.item.confirmed,
});

const organizationName = computed(() => {
    if (!props.item.public.organization) {
        return '个人';
    }
    const organization = userStore.user.organizations.find(o => o.id === props.item.public.organization);
    if (!organization) {
        return '未知';
    }
    return organization.name;
});

const etaMinutes = computed(() => (100 - cache.progress[0]) * props.item.estimateMinutes / 100);

const permittedPublic = computed(() => {
    if (userStore.user.id === props.item.public.author) {
        return true;
    }
    const organization = userStore.user.organizations.find(o => o.id === props.item.public.organization);
    if (!organization) {
        return false;
    }
    return organization.leader === userStore.user.id || organization.managers.includes(userStore.user.id);
});

function updateProgress(value: number) {
    cache.progress[0] = value;
}

function confirm() {
    itemsStore.updateItem({
        userItem: {
            id: props.item.id,
            confirmed: true,
        }
    });
}

function deleteUserItem() {
    itemsStore.deleteItems([props.item.id], 'user');
}

type EqualType = number | string | boolean | undefined | Array<EqualType>;

function equal<T extends EqualType>(a: T, b: T): boolean {
    if (a === undefined || b === undefined) {
        return a === undefined && b === undefined;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) {
            return false;
        }
        return a.every((v, i) => equal(v, b[i]));
    }
    return a === b;
}

let oldCache = cloneDeep(cache);

watch(() => cache, useDebounceFn((newCache) => {
    const keys = Object.keys(newCache) as (keyof typeof cache)[];
    const updates: ItemsUpdate = {
        publicItem: undefined,
        userItem: undefined,
    };
    const publicItem = () => {
        if (updates.publicItem === undefined) {
            updates.publicItem = { id: props.item.publicItem };
        }
        return updates.publicItem;
    }
    const userItem = () => {
        if (updates.userItem === undefined) {
            updates.userItem = { id: props.item.id };
        }
        return updates.userItem;
    }
    function getUpdater(key: keyof typeof cache) {
        switch (key) {
            case 'progress':
                return () => { userItem().progress = newCache.progress[0] / 100; }
            case 'confirmed':
                return () => { userItem().confirmed = newCache.confirmed; }
            case 'userEstimate':
                return () => { userItem().estimateMinutes = newCache.userEstimate; }
            case 'deadline':
                return () => { publicItem().deadline = dayjs(newCache.deadline).toISOString(); }
            case 'description':
                return () => { publicItem().description = newCache.description; }
        }
    }
    keys.forEach(key => {
        const oldVal = oldCache[key];
        const val = newCache[key];
        if (!equal(oldVal, val)) {
            getUpdater(key)();
        }
    });
    oldCache = cloneDeep(newCache);
    itemsStore.updateItem(Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined)));
}, 300), { deep: true });

watch(() => props.item.progress, (newValue, oldValue) => {
    if (newValue !== oldValue) {
        updateProgress(newValue * 100);
    }
});

watch(() => props.item.public.description, (newValue, oldValue) => {
    if (newValue !== oldValue) {
        cache.description = newValue;
    }
});
</script>

<template>
    <div class="rounded-lg hover:bg-slate-50 px-3 pt-1 border-t border-slate-300 flex flex-col transition-colors duration-300 ease-in-out"
        :class="{ 'bg-lime-50': cache.progress[0] === 100 }">
        <div class="flex w-full gap-2 items-center">
            <span class="text-sm font-bold" :style="{ color }">{{ source.index }}</span>
            <Badge class="flex flex-row items-center h-6 font-mono">
                <div>{{ source.subject?.abbr }}</div>
            </Badge>
            <div class="flex-grow">
                <MiniEditor v-model="cache.description" placeholder="请输入公开内容/描述"></MiniEditor>
            </div>
            <Dialog>
                <DialogTrigger>
                    <div class="hover:bg-blue-100 active:bg-blue-200 rounded-md p-1">
                        <Icon icon="tabler:edit" />
                    </div>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>编辑项目</DialogTitle>
                        <MiniEditor v-model="cache.description" placeholder="请输入公开内容/描述" disabled></MiniEditor>
                    </DialogHeader>
                    <div class="flex flex-col gap-2">
                        <div class="flex gap-1 items-center">
                            <span>截止日期改为</span>
                            <Input type="datetime-local" v-model="cache.deadline" class="w-48 h-7"></Input>
                        </div>
                        <div class="flex gap-1 items-center">
                            <span>个人预估时间改为</span>
                            <Input type="number" min="0" step="1" v-model="cache.userEstimate" class="w-20 h-7"></Input>
                            <span>分钟</span>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <DropdownMenu>
                <DropdownMenuTrigger>
                    <div class="hover:bg-blue-100 active:bg-blue-200 rounded-md p-1">
                        <Icon icon="weui:more-filled" class="w-6 h-6" />
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent class="flex flex-col">
                    <DropdownMenuItem>
                        <DropdownMenuLabel class="">
                            <div>归属：{{ organizationName }}</div>
                        </DropdownMenuLabel>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <DropdownMenuLabel class="flex items-center gap-1">
                            <Icon icon="tabler:tag-filled"></Icon> {{ source.range }}
                        </DropdownMenuLabel>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <DropdownMenuLabel class="flex items-center gap-1">
                            <Icon icon="icon-park:deadline-sort"></Icon>
                            {{ source.deadline }}
                        </DropdownMenuLabel>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <DropdownMenuLabel>
                            <div class="flex items-center gap-1">
                                <Icon icon="hugeicons:estimate-02"></Icon>
                                <div class="text-base">{{ itemsStore.toHumanTime(item.estimateMinutes) }}</div>
                                <div class="text-xs">{{ itemsStore.toHumanTime(item.public.estimateMinutes) }}</div>
                            </div>
                        </DropdownMenuLabel>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <DropdownMenuLabel class="text-red-500 flex items-center gap-1" @click="deleteUserItem">
                            <Icon icon="material-symbols:delete-outline" />删除（仅个人）
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                    </DropdownMenuItem>
                    <DropdownMenuItem v-if="permittedPublic">
                        <DropdownMenuLabel class="text-red-500 flex items-center gap-1"
                            @click="itemsStore.deleteItems([item.publicItem], 'public')">
                            <Icon icon="material-symbols:delete-outline" />删除（全体）
                        </DropdownMenuLabel>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <div class="flex w-full items-center my-1" v-if="item.confirmed">
            <div class="flex-grow">
                <ProgressSlider v-model="cache.progress" :min="0" :max="100" :step="1"
                    :max-progress="sharedProgress.max" :avg-progress="sharedProgress.avg"
                    :max-name="sharedProgress.maxName">
                </ProgressSlider>
            </div>
            <div class="text-xs text-slate-700 text-center font-mono font-bold w-24">
                {{ cache.progress[0].toFixed(0) }}% -{{ itemsStore.toHumanTime(etaMinutes) }}</div>
            <div>
                <Button class="h-4 px-1 py-1 bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800"
                    @click="updateProgress(100)">
                    <Icon icon="charm:square-tick" />
                </Button>
            </div>
        </div>
        <div v-else class="flex justify-center pb-1 gap-2">
            <div class="flex gap-1 items-center">
                <span>预估</span>
                <Input type="number" min="0" step="1" v-model="cache.userEstimate" class="w-20 h-7"></Input>
                <span>分钟</span>
            </div>
            <Button class="h-8" @click="confirm">添加此作业</Button>
            <Button variant="destructive" class="h-8" @click="deleteUserItem">删除</Button>
        </div>
    </div>
</template>
