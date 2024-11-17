import { ref, computed, isRef, type Ref, type WatchSource } from 'vue';
import { watchIgnorable, useDebounceFn } from '@vueuse/core';

type OptimisticUpdateParams<T, S, C> = {
    source: WatchSource<S>,
    update: (value: C) => Promise<void>,
    fromSource: (source: S) => T,
    trackedValue: (data: Ref<T>) => WatchSource<C>,
    onError?: (error: unknown) => void,
    debounceMs?: number,
}

export function useOptimisticUpdate<T, S = T, C = T>({ source, fromSource, trackedValue, update, onError, debounceMs }: OptimisticUpdateParams<T, S, C>) {
    const sourceGetter = () => {
        if (isRef(source)) {
            return source.value;
        } else {
            return source();
        }
    };
    const data = ref(fromSource(sourceGetter())) as Ref<T>;
    const pendingCount = ref(0);
    const pending = computed(() => pendingCount.value > 0);

    const { ignoreUpdates } = watchIgnorable(trackedValue(data), useDebounceFn(value => {
        pendingCount.value++;
        update(value).then(() => {
            pendingCount.value--;
        }).catch(error => {
            pendingCount.value--;
            ignoreUpdates(() => {
                data.value = fromSource(sourceGetter());
            });
            (onError ?? console.error)(error);
        });
    }, debounceMs));

    watchIgnorable(source, value => ignoreUpdates(() => {
        data.value = fromSource(value);
    }));

    return {
        data,
        pending,
    }
}
