<script setup lang="ts">
import { computed } from 'vue';
import type { Item } from 'types/contract';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/vue'
import dayjs from 'dayjs';

const props = defineProps<{
    item: Item;
}>();

const deadline = computed(() => dayjs(props.item.public.deadline).format("MM/DD HH:mm"));

function toHumanTime(minutes: number) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) {
        return `${h}h ${m}m`;
    } else {
        return `${m}min`;
    }
}

</script>

<template>
    <Card>
        <CardHeader>
            <div class="flex">
                <div>{{ item.public.subject.abbr }}</div>
                <CardTitle>
                    <div v-html="item.public.description"></div>
                </CardTitle>
            </div>
        </CardHeader>
        <CardContent>
            <div v-if="item.note">{{ item.note }}</div>
            <div>
                <div class="flex gap-2 items-center">
                    <div>{{ toHumanTime(item.estimateMinutes) }}</div>
                    <div><del>{{ toHumanTime(item.public.estimateMinutes) }}</del></div>
                    <Badge>{{ item.public.range }}</Badge>
                    <div class="flex items-center"><Icon icon="icon-park:deadline-sort"></Icon>{{ deadline }}</div>
                </div>
            </div>
            <div>
                <input type="range" name="progress" min="0" max="1" step="0.01" :value="item.progress">
                <Button>0%</Button>
            </div>
        </CardContent>
    </Card>
</template>
