<script setup lang="ts">
import { computed, reactive } from 'vue';
import dayjs from 'dayjs';
import type { Item } from '../../types/contract';
import { useItemsStore } from '@/stores/items';
import { useUserStore } from '@/stores/user';
import { useShareStore } from '@/stores/share';
import { useTimeStore } from '@/stores/time';
import { useOptimisticUpdate } from '@/lib/optimistic';

import MiniEditor from '@/components/MiniEditor.vue';
import ProgressSlider from '@/components/ProgressSlider.vue';
import FocusDisplay from '@/components/FocusDisplay.vue';
import { Icon } from '@iconify/vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import router from '@/router';

const props = defineProps<{
    index: number;
    item: Item;
    focusMode?: boolean;
}>();

const itemsStore = useItemsStore();
const userStore = useUserStore();
const shareStore = useShareStore();
const timeStore = useTimeStore();

const source = computed(() => {
    return {
        index: (props.index + 1).toString().padStart(2, '0'),
        subject: itemsStore.subjects.find(s => s.id === props.item.public.subject),
        subjectColor: itemsStore.subjectColors.get(props.item.public.subject),
        deadline: props.item.public.deadline ? dayjs(props.item.public.deadline).format("MM/DD HH:mm") : undefined,
        range: props.item.public.range,
        isWorkedOn: userStore.user?.workingOn === props.item.publicItem,
        snapPoints: props.item.public.snaps ? props.item.public.snaps.split(',').map(s => parseInt(s)) : undefined,
    };
});
const progressData = computed(() => {
    if (!props.item.public.organization) {
        return {
            [userStore.userBasic.username]: props.item.progress * 100,
        };
    }
    const orgProgress = shareStore.sharedProgress[props.item.public.organization];
    if (orgProgress === undefined) {
        return undefined;
    }
    return Object.fromEntries(Object.entries(orgProgress.items[props.item.publicItem] ?? {})
        .map(([uid, p]) => ([orgProgress.users.find(u => u.id === uid)?.name ?? uid, p[0] / p[1] * 100])));
});

// const URGENCY_POINTS = [-1440, -480, 0, 15, 60, 180, 480, 1440, 4320, 10080]
const URGENCY_POINTS = [
    [0, '#edcbc0'],
    [120 * 60, '#f7e6ca'],
    [1440 * 60, '#cfe3ec'],
    [4320 * 60, '#b1cfd9'],
] as const;

const remainingSeconds = computed(() => dayjs(props.item.public.deadline).diff(dayjs(timeStore.now), 'seconds'));

const shortRemaining = computed(() => {
    if (localProgress.value === 100) {
        return '√';
    }
    const seconds = Math.ceil(remainingSeconds.value)
    if (seconds < 0) {
        return '>_<';
    }
    return timeStore.format_short(Math.ceil(remainingSeconds.value));
});

const backgroundColor = computed(() => {
    if (localProgress.value === 100) {
        return '#99c1a9';
    }
    return URGENCY_POINTS.find(d => d[0] >= remainingSeconds.value)?.[1] ?? '#b6d5c5';
});

const animation = computed(() => {
    const stressed = source.value.isWorkedOn;
    let animationPoints = 0;
    if (props.item.public.organization) {
        const orgProgress = shareStore.sharedProgress[props.item.public.organization];
        if (orgProgress === undefined) {
            return undefined;
        }
        animationPoints += orgProgress.users.map(user => user.workingOn).filter(id => id === props.item.publicItem).length;
    }
    if (stressed) {
        animationPoints += 2;
    }
    if (animationPoints === 0) {
        return undefined;
    }
    return {
        duration: Math.ceil(10_000 / animationPoints),
        stressed,
    };
});

const workOnColor = computed(() => {
    return source.value.isWorkedOn ? 'blue' : 'gray';
});

const operationStatus = reactive({
    editing: false,
});

const { data: localProgressRaw } = useOptimisticUpdate({
    source: () => props.item.progress,
    fromSource: (source) => [source * 100] satisfies [number],
    trackedValue: (data) => () => data.value[0],
    update: (value) => {
        if (value === 100 && source.value.isWorkedOn) {
            toggle_work_on();
        }
        return itemsStore.updateItem({
            userItem: {
                id: props.item.id,
                progress: value / 100,
            }
        });
    },
    debounceMs: 300,
});

const { data: description } = useOptimisticUpdate({
    source: () => props.item.public.description,
    fromSource: (source) => source,
    trackedValue: (data) => data,
    update: (value) => {
        return itemsStore.updateItem({
            publicItem: {
                id: props.item.publicItem,
                description: value,
            }
        });
    },
    debounceMs: 300,
});

const { data: deadline } = useOptimisticUpdate({
    source: () => props.item.public.deadline,
    fromSource: (source) => {
        return source ? dayjs(source).format("YYYY-MM-DD" + "T" + "HH:mm") : undefined;
    },
    trackedValue: (data) => data,
    update: (value) => {
        return itemsStore.updateItem({
            publicItem: {
                id: props.item.publicItem,
                deadline: value ? dayjs(value).toISOString() : undefined,
            }
        });
    },
    debounceMs: 200,
});

const { data: userEstimate } = useOptimisticUpdate({
    source: () => props.item.estimateMinutes,
    fromSource: (source) => source,
    trackedValue: (data) => data,
    update: (value) => {
        return itemsStore.updateItem({
            userItem: {
                id: props.item.id,
                estimateMinutes: value,
            }
        });
    },
    debounceMs: 200,
});

const localProgress = computed(() => localProgressRaw.value[0]);

const organizationName = computed(() => {
    if (!props.item.public.organization) {
        return '个人';
    }
    const organization = userStore.user?.organizations?.find(o => o.id === props.item.public.organization);
    if (!organization) {
        return '未知';
    }
    return organization.name;
});

const etaMinutes = computed(() => (100 - localProgress.value) * props.item.estimateMinutes / 100);

const permittedPublic = computed(() => {
    if (userStore.userBasic.id === props.item.public.author) {
        return true;
    }
    const organization = userStore.user?.organizations.find(o => o.id === props.item.public.organization);
    if (!organization) {
        return false;
    }
    return organization.leader === userStore.userBasic.id || organization.managers.includes(userStore.userBasic.id);
});

function confirm() {
    itemsStore.updateItem({
        userItem: {
            id: props.item.id,
            confirmed: true,
        }
    });
}

function deleteUserItem() {
    itemsStore.deleteItems([props.item.id], 'user', false);
}

async function toggle_work_on() {
    if (!source.value.isWorkedOn) {
        await userStore.work_on(props.item.publicItem);
    } else {
        await userStore.work_on(undefined);
        if (props.focusMode) {
            router.replace('/');
        }
    }
}
</script>

<template>
    <div class="rounded-lg hover:bg-slate-50 px-3 pt-1 border-t border-slate-300 flex flex-col transition-colors duration-300 ease-in-out"
        :class="{ 'bg-lime-50': localProgress === 100 }">
        <div class="flex w-full gap-2 items-center">
            <div>
                <div class="text-sm font-bold inline-block">{{ source.index }}</div>
            </div>
            <Badge class="flex flex-row items-center h-6 font-mono" :style="{ backgroundColor: source.subjectColor }">
                <div>{{ source.subject?.abbr }}</div>
            </Badge>
            <div class="flex-grow">
                <MiniEditor v-model="description" placeholder="请输入公开内容/描述"></MiniEditor>
            </div>
            <Button variant="ghost" @click="operationStatus.editing = !operationStatus.editing"
                class="hover:bg-blue-100 active:bg-blue-200 rounded-md p-1 h-6"
                :class="{ 'bg-blue-300': operationStatus.editing }" aria-label="编辑项目">
                <Icon icon="tabler:edit" />
            </Button>
        </div>
        <div class="flex w-full items-center my-1" v-if="item.confirmed">
            <div class="text-xs inline-block text-white py-0.5 rounded-full font-mono relative w-8 text-center mr-2"
                :style="{ backgroundColor }">{{ shortRemaining }}</div>
            <div class="flex-grow">
                <ProgressSlider v-model="localProgressRaw" :min="0" :max="100" :step="1" :progress-data="progressData"
                    :animation="animation" :snap-points="source.snapPoints">
                </ProgressSlider>
            </div>
            <div class="text-xs text-slate-700 text-center font-mono font-bold w-24">
                {{ localProgress.toFixed(0) }}% -{{ timeStore.format_regular(etaMinutes) }}</div>
            <div>
                <Button variant="ghost" class="h-4 p-0 hover:bg-slate-200" @click="toggle_work_on" aria-label="开始/结束工作">
                    <Icon icon="ph:record-bold" :color="workOnColor" />
                </Button>
            </div>
        </div>
        <div v-else class="flex justify-center pb-1 gap-2">
            <div class="flex gap-1 items-center">
                <span>预估</span>
                <Input type="number" min="0" step="1" v-model="userEstimate" class="w-20 h-7"></Input>
                <span>分钟</span>
            </div>
            <Button class="h-8" @click="confirm">添加此作业</Button>
            <Button variant="destructive" class="h-8" @click="deleteUserItem">删除</Button>
        </div>
        <Collapsible :open="operationStatus.editing">
            <CollapsibleContent>
                <div class="p-2 flex flex-col gap-2">
                    <div class="text-lg font-bold text-center">编辑项目</div>
                    <div class="flex flex-col gap-2">
                        <div class="flex gap-1 items-center">
                            <Icon icon="icons8:organization" />
                            <span class="w-12">组织</span>
                            <!--TODO permission control-->
                            <Input type="text" disabled v-model="organizationName" class="h-7" />
                        </div>
                        <div class="flex gap-1 items-center">
                            <Icon icon="tabler:tag-filled" />
                            <span class="w-12">范围</span>
                            <Select disabled v-model="source.range">
                                <SelectTrigger class="h-7">
                                    <SelectValue></SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">全体</SelectItem>
                                    <SelectItem value="some">部分</SelectItem>
                                    <SelectItem value="private">个人</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div class="flex gap-1 items-center">
                            <Icon icon="tabler:calendar-event" />
                            <span class="w-12">截至</span>
                            <Input type="datetime-local" v-model="deadline" class="h-7"></Input>
                        </div>
                        <div class="flex gap-1 items-center">
                            <Icon icon="hugeicons:estimate-02" />
                            <span>预估时间</span>
                            <div class="flex flex-col gap-1">
                                <div class="flex gap-1 items-center">
                                    <Icon icon="ant-design:global-outlined" />
                                    <span class="w-12">公共</span>
                                    <Input type="number" min="0" step="1" v-model="userEstimate" class="w-16 h-7"
                                        disabled></Input>
                                    <span>分钟</span>
                                </div>
                                <div class="flex gap-1 items-center">
                                    <Icon icon="ant-design:user-outlined" />
                                    <span class="w-12">个人</span>
                                    <Input type="number" min="0" step="1" v-model="userEstimate"
                                        class="w-16 h-7"></Input>
                                    <span>分钟</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <Button variant="outline" class="font-bold flex-grow">
                                <div class="text-red-500 flex items-center gap-1" @click="deleteUserItem">
                                    <Icon icon="material-symbols:delete-outline" />删除（仅个人）
                                </div>
                            </Button>
                            <Button variant="outline" class="font-bold flex-grow">
                                <div v-if="permittedPublic" class="text-red-500 flex items-center gap-1"
                                    @click="itemsStore.deleteItems([item.publicItem], 'public', false)">
                                    <Icon icon="material-symbols:delete-outline" />删除（全体）
                                </div>
                            </Button>
                        </div>
                    </div>
                </div>
            </CollapsibleContent>
        </Collapsible>
        <Collapsible :open="source.isWorkedOn">
            <CollapsibleContent>
                <FocusDisplay :focus-mode="focusMode"></FocusDisplay>
            </CollapsibleContent>
        </Collapsible>
    </div>
</template>
