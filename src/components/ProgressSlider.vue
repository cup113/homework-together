<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import type { SliderRootEmits, SliderRootProps } from 'radix-vue'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack, useForwardPropsEmits } from 'radix-vue'
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { omit } from 'es-toolkit/object'
import { cn } from '@/lib/utils'

const props = defineProps<SliderRootProps & { class?: HTMLAttributes['class'] } & {
  maxProgress?: number;
  maxName?: string;
  avgProgress?: number;
}>()
const emits = defineEmits<SliderRootEmits>()
const thumbs = computed(() => props.disabled ? [] : props.modelValue);

const maxStyle = computed(() => {
  if (props.maxProgress === undefined) {
    return { display: 'none' };
  } else {
    return { left: `calc(${props.maxProgress * 100}% - 2px)` };
  }
})

const avgStyle = computed(() => {
  if (props.avgProgress === undefined) {
    return { display: 'none' };
  } else {
    return { left: `calc(${props.avgProgress * 100}% - 2px)` };
  }
})

const delegatedProps = computed(() => omit(props, ['class']))

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <TooltipProvider :delay-duration="disabled ? 200 : 500">
    <Tooltip>
      <TooltipTrigger class="w-full">
        <SliderRoot :class="cn(
          'relative flex w-full touch-none select-none items-center',
          props.class,
        )" v-bind="forwarded">
          <SliderTrack class="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
            <SliderRange class="absolute h-full bg-lime-800" />
            <div class="absolute h-full w-0.5 bg-amber-500 opacity-70" :style="avgStyle"></div>
            <div class="absolute h-full w-0.5 bg-cyan-500 opacity-70" :style="maxStyle"></div>
          </SliderTrack>
          <SliderThumb v-for="(_, key) in thumbs" :key="key"
            class="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
        </SliderRoot>
      </TooltipTrigger>
      <TooltipContent v-if="maxProgress !== undefined || avgProgress !== undefined">
        <div>max: {{ ((maxProgress ?? 0) * 100).toFixed(1) }}%<span v-if="maxName"> ({{ maxName }})</span></div>
        <div>avg: {{ ((avgProgress ?? 0) * 100).toFixed(1) }}%</div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
