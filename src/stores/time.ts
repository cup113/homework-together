import { defineStore } from "pinia";
import { useNow } from "@vueuse/core";
import dayjs from "dayjs";
import { computed } from "vue";

export const useTimeStore = defineStore("time", () => {
    const _now = useNow({
        interval: 1000,
    });

    function format_regular(minutes: number) {
        minutes = Math.round(minutes);
        const h = Math.floor(minutes / 60);
        const m = (minutes % 60).toFixed(0).padStart(2, '0');
        return `${h}:${m}`;
    }

    function format_long(seconds: number) {
        seconds = Math.round(seconds);
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toFixed(0).padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    function format_short(seconds: number) {
        seconds = Math.round(seconds);
        if (seconds <= 99) {
            return `${seconds}s`;
        }
        const m = Math.ceil(seconds / 60);
        if (m <= 99) {
            return `${m}m`;
        }
        const h = Math.ceil(m / 60);
        if (h <= 99) {
            return `${h}h`;
        }
        const d = Math.ceil(h / 24);
        return `${d}d`;
    }

    const now = computed(() => dayjs(_now.value));

    return {
        now,
        format_regular,
        format_long,
        format_short,
    }
});
