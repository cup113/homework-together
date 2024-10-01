<script setup lang="ts">
import { computed } from 'vue';
import { TableRow, TableCell } from '@/components/ui/table';

const props = defineProps<{
    rank: number;
    name: string;
    percentage: number;
}>();

const rankString = computed(() => {
    const rank = props.rank.toString().padStart(2, '0');
    return `#${rank}`;
})
</script>

<template>
    <TableRow>
        <TableCell>{{ rankString }}</TableCell>
        <TableCell>{{ name }}</TableCell>
        <TableCell>
            <meter :value="percentage" min="0" max="100"></meter>
            <span>{{ percentage }}%</span>
        </TableCell>
    </TableRow>
</template>
