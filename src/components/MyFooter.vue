<script lang="ts" setup>
import { Icon } from '@iconify/vue';
import { useNetworkStore } from '@/stores/network';

const networkStore = useNetworkStore();
</script>

<template>
    <footer class="bg-slate-100 text-slate-700 text-center text-sm mt-8 py-4">
        <div class="flex flex-col md:flex-row gap-2 md:gap-8 justify-center">
            <div>Homework Together Since 2024.9</div>
            <div>
                <a href="https://github.com/cup113/homework-together" target="_blank"
                    class="hover:bg-slate-200 rounded-md gap-1 flex items-center justify-center">
                    <Icon icon="mdi:github" class="h-4 w-4"></Icon>Open Source
                </a>
            </div>
            <div>Build Version: {{ networkStore.buildVersion }}</div>
            <div class="flex justify-center items-center">
                <img src="https://badges.pufler.dev/visits/cup113/homework-together">
            </div>
        </div>
    </footer>
</template>
