<script setup lang="ts">
import { computed } from 'vue';
import { TableRow, TableCell } from '@/components/ui/table';
import ProgressSlider from './ProgressSlider.vue';

const props = defineProps<{
    rank: number;
    name: string;
    percentage: number;
}>();

const rankString = computed(() => {
    const rank = props.rank.toString().padStart(2, '0');
    return `#${rank}`;
});

const modelValue = computed({
    get() { return [props.percentage]; },
    set() {},
});
</script>

<template>
    <TableRow>
        <TableCell>{{ rankString }}</TableCell>
        <TableCell>{{ name }}</TableCell>
        <TableCell>
            <div>
                <ProgressSlider disabled v-model="modelValue" :min="0" :max="100"></ProgressSlider>
                <span>{{ percentage.toFixed(2) }}%</span>
            </div>
        </TableCell>
    </TableRow>
</template>
