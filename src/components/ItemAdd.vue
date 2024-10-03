<script setup lang="ts">
import { ref } from 'vue';
import dayjs from 'dayjs';
import { useItemsStore } from '@/stores/items';

import { PublicItemsRangeOptions } from '@/../types/pocketbase-types';
import MiniEditor from './MiniEditor.vue';
import { Select, SelectTrigger, SelectValue, SelectGroup, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useUserStore } from '@/stores/user';

const itemsStore = useItemsStore();

const subject = ref(undefined as string | undefined);
const description = ref('<p></p>');
const note = ref('<p></p>');
const range = ref(PublicItemsRangeOptions.all);
const progress = ref([0]);
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
        progress: progress.value[0],
        estimateMinutes: userMinutes.value,
    });
}
</script>

<template>
    <div class="rounded-lg hover:bg-slate-50 px-2">
        <div class="flex flex-row gap-1 items-center">
            <div class="w-24 flex flex-col gap-1">
                <div>
                    <Slider v-model="progress" :min="0" :max="100" :step="1"></Slider>
                </div>
                <div class="text-sm text-slate-700 text-center">{{ progress[0] }}%</div>
            </div>
            <div class="flex flex-col w-96">
                <div class="flex gap-1 items-center">
                    <Select v-model="subject">
                        <SelectTrigger class="w-20 py-0 h-8">
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
                <hr>
                <div class="flex items-center">
                    <Select v-model="range">
                        <SelectTrigger class="w-20 h-8">
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
            </div>
            <div class="flex gap-1 items-center">
                <div>
                    <div class="flex items-center"><span class="w-12">公开</span><Input class="px-2 w-20" type="number"
                            min="0" step="1" v-model="publicMinutes" /></div>
                    <div class="flex items-center"><span class="w-12">个人</span><Input class="px-2 w-20" type="number"
                            min="0" step="1" v-model="userMinutes" /></div>
                </div>
            </div>
            <Input type="datetime-local" v-model="deadline" class="w-48" />
            <Button @click="addItem()">添加</Button>
        </div>
    </div>
</template>
