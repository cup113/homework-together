<script setup lang="ts">
import { computed } from 'vue';
import { useItemsStore } from '@/stores/items';
import { useTimeStore } from '@/stores/time';
import { useShareStore } from '@/stores/share';
import { useUserStore } from '@/stores/user';

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

const animation = computed(() => {
    let animationPoints = 0;
    let stressed = false;
    const subjectItems = itemsStore.items.filter(i => i.public.subject === props.subject.id).map(i => i.publicItem);
    shareStore.sharedProgress.users.forEach(u => {
        if (subjectItems.includes(u.workingOn)) {
            animationPoints++;
            if (u.id === userStore.user.id) {
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
</script>

<template>
    <div class="flex items-center gap-3 px-2 py-2 border-b border-slate-200" :class="{ 'bg-lime-50': subject.done === subject.total }">
        <div>{{ subject.name }}</div>
        <div class="grow">
            <ProgressSlider disabled v-model="doneValue" :max="subject.total" :max-progress="sharedProgress.max"
                :max-name="sharedProgress.maxName" :avg-progress="sharedProgress.avg" :animation="animation"></ProgressSlider>
            <div class="ml-4 text-slate-500">{{ timeStore.format_regular(subject.done) }} / {{ timeStore.format_regular(subject.total) }}</div>
        </div>
    </div>
</template>
