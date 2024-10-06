<script setup lang="ts">
import { type HTMLAttributes, computed, watch } from 'vue'

import type { SliderRootEmits, SliderRootProps } from 'radix-vue'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack, useForwardPropsEmits } from 'radix-vue'
import { Icon } from '@iconify/vue';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { omit } from 'es-toolkit/object'
import { cn } from '@/lib/utils'

defineSlots<{
  default(): unknown;
}>();
const props = defineProps<SliderRootProps & { class?: HTMLAttributes['class'] } & {
  maxProgress?: number;
  maxName?: string;
  avgProgress?: number;
  snapPoints?: number[];
}>()
const DEFAULT_SNAP_POINTS = [0, 20, 40, 50, 60, 80, 90, 95, 100];

const snapPoints = computed(() => props.snapPoints ?? (props.disabled ? [] : DEFAULT_SNAP_POINTS));

const emits = defineEmits<SliderRootEmits>()
const thumbs = computed(() => props.disabled ? [] : props.modelValue);

const maxStyle = computed(() => {
  if (props.maxProgress === undefined) {
    return { display: 'none' };
  } else {
    return { left: `calc(${props.maxProgress * 100}% - 2%)`, width: '4%' };
  }
})

const avgStyle = computed(() => {
  if (props.avgProgress === undefined) {
    return { display: 'none' };
  } else {
    return { left: `calc(${props.avgProgress * 100}% - 2%)`, width: '4%' };
  }
})

const currentPercentage = computed(() => {
  if (props.modelValue === undefined) {
    return "--%";
  } else {
    return (props.modelValue[0] / (props.max ?? 100) * 100).toFixed(1) + '%';
  }
})

const delegatedProps = computed(() => omit(props, ['class']))

const forwarded = useForwardPropsEmits(delegatedProps, emits)

watch(() => props.modelValue, newValue => {
  if (newValue === undefined) {
    return;
  }
  const nearSnapPoint = snapPoints.value
    .map(snapPoint => ({ value: snapPoint, diff: Math.abs(newValue[0] - snapPoint) }))
    .filter(snapPoint => snapPoint.diff <= 3)
    .sort((a, b) => a.diff - b.diff)[0];
  if (nearSnapPoint && nearSnapPoint.value !== newValue[0]) {
    emits('update:modelValue', [nearSnapPoint.value]);
  }
})
</script>

<template>
  <div class="flex" :class="disabled ? 'gap-0.5' : 'gap-3'">
    <Popover v-if="maxProgress !== undefined || avgProgress !== undefined">
      <PopoverTrigger>
        <Icon icon="raphael:info" />
      </PopoverTrigger>
      <PopoverContent>
        <div>Current: {{ currentPercentage }}</div>
        <div>Max: {{ ((maxProgress ?? 0) * 100).toFixed(1) }}%<span v-if="maxName"> ({{ maxName }})</span></div>
        <div>Avg: {{ ((avgProgress ?? 0) * 100).toFixed(1) }}%</div>
      </PopoverContent>
    </Popover>
    <SliderRoot :class="cn(
      'relative flex w-full touch-none select-none items-center',
      props.class,
    )" v-bind="forwarded">
      <SliderTrack class="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderRange class="absolute h-full bg-lime-800" :class="{ 'progress-transition': disabled }" />
        <span v-for="snapPoint in snapPoints" :key="snapPoint" class="absolute block h-full bg-slate-500 opacity-20"
          :style="{ width: '1px', left: `calc(${snapPoint}% - 1px)` }"></span>
        <span class="absolute block h-full bg-amber-500 opacity-70 progress-transition" :style="avgStyle"></span>
        <span class="absolute block h-full bg-cyan-500 opacity-70 progress-transition" :style="maxStyle"></span>
      </SliderTrack>
      <SliderThumb v-for="(_, key) in thumbs" :key="key"
        class="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
    </SliderRoot>
  </div>
</template>
