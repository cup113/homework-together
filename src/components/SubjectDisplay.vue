<script setup lang="ts">
import { computed } from 'vue';
import { useItemsStore } from '@/stores/items';
import { useShareStore } from '@/stores/share';

import ProgressSlider from '@/components/ProgressSlider.vue';
import { TableRow, TableCell } from '@/components/ui/table';
import type { Subject } from '@/../types/contract';

const props = defineProps<{
    subject: Subject & { done: number, total: number };
}>();

const itemsStore = useItemsStore();
const shareStore = useShareStore();

const sharedProgress = computed(() => {
    const userProgress = Object.entries(shareStore.sharedProgress.subjects[props.subject.id] ?? {})
        .map(([id, p]) => ({ id, progress: p[0] / p[1] }));
    if (userProgress.length === 0) {
        return {
            max: undefined,
            maxNames: [],
            avg: undefined,
        };
    }
    const max = Math.max.apply(null, userProgress.map(p => p.progress));
    const maxNames = userProgress.filter(p => p.progress === max)
        .map(p => shareStore.sharedProgress.users.find(u => u.id === p.id)?.name)
        .filter(name => name !== undefined);
    const avg = userProgress.reduce((acc, cur) => acc + cur.progress, 0) / userProgress.length;
    return {
        max,
        maxName: maxNames.join(', '),
        avg,
    };
});

const doneValue = computed({
    get() { return [props.subject.done] },
    set() { }
}); // disabled slider v-model
</script>

<template>
    <TableRow>
        <TableCell>{{ subject.name }}</TableCell>
        <TableCell>
            <ProgressSlider disabled v-model="doneValue" :max="subject.total" :max-progress="sharedProgress.max"
                :max-name="sharedProgress.maxName" :avg-progress="sharedProgress.avg"></ProgressSlider>
            <span>{{ itemsStore.toHumanTime(subject.done) }} / {{ itemsStore.toHumanTime(subject.total) }}</span>
        </TableCell>
    </TableRow>
</template>
