<script setup lang="ts">
import { computed } from 'vue';
import { useItemsStore } from '@/stores/items';
import { useTimeStore } from '@/stores/time';
import { useShareStore } from '@/stores/share';
import { useUserStore } from '@/stores/user';
import { useTransitionedNumber } from '@/lib/animation';

import ProgressSlider from '@/components/ProgressSlider.vue';
import type { Subject } from '@/../types/contract';

const props = defineProps<{
    subject: Subject & { done: number, total: number };
}>();

const userStore = useUserStore();
const itemsStore = useItemsStore();
const timeStore = useTimeStore();
const shareStore = useShareStore();

const sharedProgress = computed(() => {
    const result: Record<string, number> = {};
    if (!shareStore.subjectProgress[props.subject.id]) {
        return result;
    }
    Object.entries(shareStore.subjectProgress[props.subject.id]).forEach(([, user]) => {
        result[user.name] = user.done;
    });
    return result;
});

const animation = computed(() => {
    let animationPoints = 0;
    let stressed = false;
    const subjectItems = itemsStore.items.filter(i => i.public.subject === props.subject.id).map(i => i.publicItem);
    if (!shareStore.subjectProgress[props.subject.id]) {
        return undefined;
    }
    Object.entries(shareStore.subjectProgress[props.subject.id]).forEach(([, u]) => {
        if (subjectItems.includes(u.workingOn)) {
            animationPoints++;
            if (u.id === userStore.userBasic.id) {
                stressed = true;
                animationPoints += 2;
            }
        }
    });
    if (animationPoints === 0) {
        return undefined;
    }

    return {
        duration: Math.ceil(15_000 / animationPoints),
        stressed,
    };
});

const doneValue = computed({
    get() { return [props.subject.done] },
    set() { }
}); // disabled slider v-model

const transitionedDone = useTransitionedNumber(
    () => props.subject.done,
    num => timeStore.format_regular(num),
);

const transitionedTotal = useTransitionedNumber(
    () => props.subject.total,
    num => timeStore.format_regular(num),
);
</script>

<template>
    <div class="flex items-center gap-3 px-2 py-2 border-b border-slate-200"
        :class="{ 'bg-lime-50': subject.done === subject.total }">
        <div>{{ subject.name }}</div>
        <div class="grow">
            <ProgressSlider disabled v-model="doneValue" :max="subject.total" :animation="animation" :progress-data="sharedProgress"></ProgressSlider>
            <div class="ml-4 text-slate-500">{{ transitionedDone }} / {{ transitionedTotal }}</div>
        </div>
    </div>
</template>
