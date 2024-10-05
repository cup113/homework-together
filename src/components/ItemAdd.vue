<script setup lang="ts">
import { ref } from 'vue';
import dayjs from 'dayjs';
import { useItemsStore } from '@/stores/items';

import { PublicItemsRangeOptions } from '@/../types/pocketbase-types';
import MiniEditor from './MiniEditor.vue';
import { Select, SelectTrigger, SelectValue, SelectGroup, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserStore } from '@/stores/user';

const itemsStore = useItemsStore();

const subject = ref(undefined as string | undefined);
const description = ref('<p></p>');
const note = ref('<p></p>');
const range = ref(PublicItemsRangeOptions.all);
const publicMinutes = ref(0);
const userMinutes = ref(0);
const deadline = ref(dayjs().format("YYYY-MM-DD" + "T" + "23:59"));

function addItem() {
    if (!subject.value) {
        alert('请选择学科');
        return;
    }
    if (!description.value.trim()) {
        alert('请填写公开内容/描述');
        return;
    }
    if (publicMinutes.value === 0) {
        alert('请设置时间');
        return;
    }
    const userStore = useUserStore();
    itemsStore.addItem({
        organization: userStore.user.organizations[0]?.id,
        subject: subject.value,
        description: description.value,
        range: range.value,
        estimateMinutes: publicMinutes.value,
        deadline: dayjs(deadline.value).toISOString(),
    }, {
        note: note.value,
        progress: 0,
        estimateMinutes: userMinutes.value,
    });
}
</script>

<template>
    <div class="rounded-lg hover:bg-slate-50 px-2 mb-3">
        <div class="flex flex-row gap-2 items-center">
            <div class="flex flex-col gap-2 flex-grow">
                <div class="flex items-center">
                    <Select v-model="subject">
                        <SelectTrigger class="w-20 h-8">
                            <SelectValue placeholder="学科..."></SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem v-for="subject in itemsStore.subjects" :value="subject.id"
                                    :key="subject.abbr">{{
                                        subject.name }}</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <MiniEditor v-model="description" placeholder="公开内容/描述"></MiniEditor>
                </div>
                <div class="flex items-center">
                    <Select v-model="range">
                        <SelectTrigger class="w-20 h-7">
                            <SelectValue placeholder="Range..."></SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem :value="PublicItemsRangeOptions.all">全体</SelectItem>
                                <SelectItem :value="PublicItemsRangeOptions.some">部分</SelectItem>
                                <SelectItem :value="PublicItemsRangeOptions.private">个人</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <MiniEditor v-model="note" class="text-slate-500 text-xs" placeholder="备注"></MiniEditor>
                </div>
                <div class="flex items-center gap-1 text-sm">
                    <span>时间期限</span>
                    <Input type="datetime-local" v-model="deadline" class="w-48 h-7" />
                </div>
            </div>
            <div class="flex flex-col gap-1 text-sm items-center flex-grow">
                <div>预估时间 (min):</div>
                <div class="flex items-center gap-1"><span>公开</span><Input class="px-2 h-8 w-16" type="number"
                        min="0" step="1" v-model="publicMinutes" /></div>
                <div class="flex items-center gap-1"><span>个人</span><Input class="px-2 w-16 h-8" type="number"
                        min="0" step="1" v-model="userMinutes" /></div>
            </div>
            <div>
                <Button @click="addItem()" class="bg-blue-500 hover:bg-blue-600 active:bg-blue-700">添加</Button>
            </div>
        </div>
    </div>
</template>
