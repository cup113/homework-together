<script setup lang="ts">
import { ref, computed } from 'vue';
import dayjs from 'dayjs';

import { useItemsStore } from '@/stores/items';
import { useUserStore } from '@/stores/user';
import { PublicItemsRangeOptions } from '@/../types/pocketbase-types';
import MiniEditor from './MiniEditor.vue';
import { Select, SelectTrigger, SelectValue, SelectGroup, SelectContent, SelectItem, SelectSeparator } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const PERSONAL_ORGANIZATION_ID = '@PERSONAL';

const itemsStore = useItemsStore();
const userStore = useUserStore();


const organizationId = ref(PERSONAL_ORGANIZATION_ID);
const subject = ref<string | undefined>(undefined);
const description = ref('<p></p>');
const range = ref(PublicItemsRangeOptions.all);
const estimateMinutes = ref(0);
const deadline = ref(dayjs().format("YYYY-MM-DD" + "T" + "23:59"));
const snapPoints = ref('');

const organizations = computed(() => userStore.user?.organizations ?? []);

function addItem() {
    if (!subject.value) {
        alert('请选择学科');
        return;
    }
    if (!description.value.trim()) {
        alert('请填写公开内容/描述');
        return;
    }
    if (estimateMinutes.value === 0) {
        alert('请设置时间');
        return;
    }
    itemsStore.addItem({
        organization: organizationId.value !== PERSONAL_ORGANIZATION_ID ? organizationId.value : undefined,
        subject: subject.value,
        description: description.value,
        range: range.value,
        estimateMinutes: estimateMinutes.value,
        deadline: dayjs(deadline.value).toISOString(),
        snaps: snapPoints.value.trim(),
    }, {
        progress: 0,
        estimateMinutes: estimateMinutes.value,
    });
}

function convertSnapPoints() {
    try {
        const { snapPoints: _snapPoints, total } = itemsStore.convertSnapPoints(snapPoints.value);
        snapPoints.value = _snapPoints;
        estimateMinutes.value = total;
    } catch (e) {
        console.error(e);
        alert('错误' + e);
    }
}

userStore.onChecked(() => {
    organizationId.value = userStore.user?.organizations[0]?.id ?? PERSONAL_ORGANIZATION_ID;
})
</script>

<template>
    <div class="flex flex-row gap-2 items-center rounded-lg hover:bg-slate-50 py-4 px-2">
        <div class="flex flex-col gap-2 flex-grow">
            <div class="flex items-center gap-4">
                <Select v-model="organizationId">
                    <SelectTrigger class="h-7">
                        <SelectValue placeholder="(组织)"></SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem :value="PERSONAL_ORGANIZATION_ID">个人</SelectItem>
                        </SelectGroup>
                        <SelectSeparator></SelectSeparator>
                        <SelectGroup>
                            <SelectItem v-for="organization in organizations" :value="organization.id"
                                :key="organization.id">
                                {{ organization.name }}
                            </SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <Select v-model="range">
                    <SelectTrigger class="h-7">
                        <SelectValue placeholder="(范围)"></SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem :value="PublicItemsRangeOptions.all">全体</SelectItem>
                            <SelectItem :value="PublicItemsRangeOptions.some">部分</SelectItem>
                            <SelectItem :value="PublicItemsRangeOptions.private">个人</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
            <div class="flex items-center">
                <Select v-model="subject">
                    <SelectTrigger class="w-24 h-8">
                        <SelectValue placeholder="(学科)"></SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem v-for="subject in itemsStore.subjects" :value="subject.id" :key="subject.abbr">
                                {{ subject.name }}</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <MiniEditor v-model="description" placeholder="公开内容/描述"></MiniEditor>
            </div>
            <div class="flex items-center gap-4">
                <div class="flex items-center gap-1 text-sm">
                    <span>时间期限</span>
                    <Input type="datetime-local" v-model="deadline" class="w-48 h-7" />
                </div>
            </div>
            <div class="flex items-center gap-2">
                <span class="text-sm w-16">间断点</span>
                <Input type="text" v-model="snapPoints" placeholder="例如: 2*2+1，可不填" class="h-7"/>
                <Button class="h-7" @click="convertSnapPoints()">计算</Button>
            </div>
            <div class="flex justify-between">
                <div class="flex gap-1 text-sm items-center flex-grow">
                    <span>预估</span>
                    <Input class="px-2 h-8 w-16" type="number" min="0" step="1" v-model="estimateMinutes" />
                    <span>min</span>
                </div>
                <Button @click="addItem()" class="bg-blue-500 hover:bg-blue-600 active:bg-blue-700">添加</Button>
            </div>
        </div>
    </div>
</template>
