<script setup lang="ts">
import { ref } from 'vue';
import dayjs from 'dayjs';
import { useItemsStore } from '@/stores/items';

import MiniEditor from './MiniEditor.vue';
import { TableRow, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectGroup, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

const itemsStore = useItemsStore();

const subject = ref(undefined as string | undefined);
const description = ref('<p></p>');
const notes = ref('<p></p>');
const range = ref('all');
const progress = ref([0]);
const publicMinutes = ref(0);
const userMinutes = ref(0);
const deadline = ref(dayjs().format("YYYY-MM-DD" + "T" + "HH:mm"));
</script>

<template>
    <TableRow>
        <TableCell>
            <Select v-model="subject">
                <SelectTrigger>
                    <SelectValue placeholder="学科..."></SelectValue>
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem v-for="subject in itemsStore.subjects" :value="subject.name" :key="subject.abbr">{{ subject.name }}</SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
        </TableCell>
        <TableCell class="flex flex-col gap-1">
            <MiniEditor v-model="description">公开内容/描述</MiniEditor>
            <MiniEditor v-model="notes">个人备注</MiniEditor>
        </TableCell>
        <TableCell><Slider v-model="progress" :min="0" :max="100" :step="1"></Slider></TableCell>
        <TableCell>
            <Select v-model="range">
                <SelectTrigger>
                    <SelectValue placeholder="Range..."></SelectValue>
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem value="all">全体</SelectItem>
                        <SelectItem value="some">部分</SelectItem>
                        <SelectItem value="private">个人</SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
        </TableCell>
        <TableCell>
            <div class="flex items-center"><span class="w-12">公开</span><Input class="px-2 w-20" type="number" min="0" step="1" v-model="publicMinutes" /></div>
            <div class="flex items-center"><span class="w-12">个人</span><Input class="px-2 w-20" type="number" min="0" step="1" v-model="userMinutes" /></div>
        </TableCell>
        <TableCell>
            <Input type="datetime-local" v-model="deadline" />
        </TableCell>
        <TableCell>
            <Button>提交</Button>
        </TableCell>
    </TableRow>
</template>
