import { useThrottle } from "@vueuse/core";
import { ref, watch, type Ref } from "vue";
import { cloneDeep } from 'es-toolkit/object';

export type EqualType = number | string | boolean | undefined | Array<EqualType> | { [K: string]: EqualType };

export const DEFAULT_THROTTLE_MS = 500;

export function equal<T extends EqualType>(a: T, b: T): boolean {
    if (a === undefined || b === undefined) {
        return a === undefined && b === undefined;
    }
    if (Array.isArray(a) || Array.isArray(b)) {
        if (!Array.isArray(a) || !Array.isArray(b)) {
            return false;
        }
        if (a.length !== b.length) {
            return false;
        }
        return a.every((v, i) => equal(v, b[i]));
    }
    if (typeof a === 'object' && typeof b === 'object') {
        if (Object.keys(a).length !== Object.keys(b).length) {
            return false;
        }
        return Object.keys(a).every(k => equal(a[k], b[k]));
    }
    return a === b;
}

export function createCache<T extends { [K: string]: EqualType }>(
    getter: () => T,
    callback: (diff: Partial<T>) => void,
    throttleMs?: number
): Ref<T> {
    const cache = ref(getter()) as Ref<T>;
    let lastValue: T = cloneDeep(cache.value);
    const throttledCache = useThrottle(cache, throttleMs ?? DEFAULT_THROTTLE_MS);
    watch(throttledCache, newValue => {
        const diff: Partial<T> = {};
        for (const key in newValue) {
            if (!equal(newValue[key], lastValue[key])) {
                diff[key as keyof T] = newValue[key];
            }
        }
        if (Object.keys(diff).length > 0) {
            lastValue = cloneDeep(newValue);
            callback(diff);
        }
    }, { deep: true });

    watch(getter, () => {
        cache.value = getter();
    })

    return cache;
}
