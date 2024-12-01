import { gsap } from 'gsap';
import { computed, reactive, watch } from 'vue';

function onBeforeEnter(el: Element) {
    try {
        (el as HTMLElement).style.opacity = '0';
        (el as HTMLElement).style.height = '0';
    } catch (e) {
        console.log(e);
    }
}

function onEnter(el: Element, done: () => void) {
    gsap.to(el, {
        opacity: 1,
        height: 'auto',
        duration: 0.5,
        delay: parseInt((el as HTMLElement).dataset.index ?? '0') * 0.1,
        onComplete: done,
    });
}

function onLeave(el: Element, done: () => void) {
    gsap.to(el, {
        opacity: 0,
        height: 0,
        duration: 0.5,
        delay: parseInt((el as HTMLElement).dataset.index ?? '0') * 0.1,
        onComplete: done,
    });
}

export function useTransitionedNumber(source: () => number, convert: (num: number) => number | string) {
    const state = reactive({
        num: source(),
    });
    watch(source, newVal => {
        gsap.to(state, { num: newVal, duration: 0.8 });
    });
    return computed(() => convert(state.num));
}

export const animation = {
    onBeforeEnter,
    onEnter,
    onLeave,
}

