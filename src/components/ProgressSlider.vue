<script setup lang="ts">
import { type HTMLAttributes, computed, watch } from 'vue'

import type { SliderRootEmits, SliderRootProps } from 'radix-vue'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack, useForwardPropsEmits } from 'radix-vue'
import { Icon } from '@iconify/vue';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { omit } from 'es-toolkit/object'
import { groupBy } from 'es-toolkit/array'
import { cn } from '@/lib/utils'

defineSlots<{
  default(): unknown;
}>();
const props = defineProps<SliderRootProps & { class?: HTMLAttributes['class'] } & {
  progressData?: Record<string, number>,
  snapPoints?: number[];
  animation?: {
    duration: number;
    stressed: boolean;
  };
}>()
const DEFAULT_SNAP_POINTS = [0, 20, 40, 50, 60, 80, 90, 95, 100];

const snapPoints = computed(() => props.snapPoints ?? (props.disabled ? [] : DEFAULT_SNAP_POINTS));

const emits = defineEmits<SliderRootEmits>()
const thumbs = computed(() => props.disabled ? [] : props.modelValue);

const rankedProgress = computed(() => {
  if (props.progressData === undefined) {
    return [];
  }
  const ranked = Object.entries(groupBy(
    Object.entries(props.progressData).map(([name, value]) => ({ name, value })),
    ({ value }) => value.toString(),
  )).map(([progress, values]) => ({
    progress: parseFloat(progress),
    names: values.map(({ name }) => name),
  })).sort((a, b) => b.progress - a.progress);
  return ranked;
});

const maxProgress = computed(() => {
  if (props.progressData === undefined || rankedProgress.value.length === 0) {
    return undefined;
  }
  return rankedProgress.value[0].progress;
});

const avgProgress = computed(() => {
  if (props.progressData === undefined || rankedProgress.value.length === 0) {
    return undefined;
  }
  const sum = rankedProgress.value.reduce((acc, { progress, names }) => acc + progress * names.length, 0)
  const count = rankedProgress.value.reduce((acc, { names }) => acc + names.length, 0)
  return sum / count
})

const maxStyle = computed(() => {
  if (maxProgress.value === undefined) {
    return { display: 'none' };
  } else {
    return { left: `calc(${maxProgress.value * 100 / (props.max ?? 100)}% - 2%)`, width: '4%' };
  }
})

const avgStyle = computed(() => {
  if (avgProgress.value === undefined) {
    return { display: 'none' };
  } else {
    return { left: `calc(${avgProgress.value * 100 / (props.max ?? 100)}% - 2%)`, width: '4%' };
  }
})

const currentPercentage = computed(() => {
  if (props.modelValue === undefined) {
    return "--%";
  } else {
    return (props.modelValue[0] / (props.max ?? 100) * 100).toFixed(1) + '%';
  }
})

const avgPercentage = computed(() => {
  if (avgProgress.value === undefined) {
    return "--%";
  } else {
    return (avgProgress.value / (props.max ?? 100) * 100).toFixed(1) + '%';
  }
})

const animationStyle = computed(() => {
  return props.animation?.duration ? { '--animation-duration': `${props.animation.duration}ms` } : {};
})

const trackClasses = computed(() => {
  if (props.animation === undefined) {
    return [];
  } else if (props.animation.stressed) {
    return ['border-2'];
  } else {
    return ['border'];
  }
})

const delegatedProps = computed(() => omit(props, ['class', 'progressData', 'animation']))

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
  <div class="flex" :class="disabled ? 'gap-0.5' : 'gap-4'">
    <Popover v-if="progressData !== undefined">
      <PopoverTrigger aria-label="进度信息">
        <Icon icon="raphael:info" />
      </PopoverTrigger>
      <PopoverContent>
        <div>当前进度: {{ currentPercentage }}</div>
        <div>平均进度: {{ avgPercentage }}</div>
        <div v-for="r, i in rankedProgress" :key="r.progress">
          <div class="flex gap-2">
            <div class="font-bold text-slate-500">#{{ i + 1 }}</div>
            <div class="min-w-16 text-amber-800 font-bold">{{ (r.progress * 100 / (props.max ?? 100)).toFixed(1) }}%</div>
            <div>{{ r.names.join(', ') }}</div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
    <SliderRoot :class="cn(
      'relative flex w-full touch-none select-none items-center',
      props.class,
    )" v-bind="forwarded" :style="animationStyle">
      <SliderTrack class="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary border-slate-700"
        :class="trackClasses">
        <SliderRange class="absolute h-full bg-lime-800"
          :class="{ 'progress-transition': disabled, 'animation': props.animation !== undefined }" />
        <span v-for="snapPoint in snapPoints" :key="snapPoint" class="absolute block h-full bg-slate-500 opacity-20"
          :style="{ width: '2px', left: `calc(${snapPoint}% - 1px)` }"></span>
        <span v-for="r in rankedProgress" :key="r.progress" class="absolute block h-full bg-purple-300 opacity-50 progress-transition" :style="{ left: `calc(${r.progress * 100 / (props.max ?? 100)}% - 2%)`, width: '4%' }"></span>
        <span class="absolute block h-full bg-orange-500 opacity-70 progress-transition" :style="avgStyle"></span>
        <span class="absolute block h-full bg-cyan-500 opacity-70 progress-transition" :style="maxStyle"></span>
      </SliderTrack>
      <SliderThumb v-for="(_, key) in thumbs" :key="key"
        class="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" aria-label="修改进度" />
    </SliderRoot>
  </div>
</template>

<style scoped>
.animation {
  animation: progress-bar-stripes var(--animation-duration, 2s) linear infinite;
  background-size: 16px 16px;
  background-image: linear-gradient(45deg, rgba(255, 255, 255, 0.25) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.25) 50%, rgba(255, 255, 255, 0.25) 75%, transparent 75%, transparent);
}

@keyframes progress-bar-stripes {
  0% {
    background-position: 0 0;
  }

  100% {
    background-position: 48px 0;
  }
}
</style>
