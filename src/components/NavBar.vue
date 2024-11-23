<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';

const userStore = useUserStore();
</script>

<template>
    <NavigationMenu class="px-6 py-2 flex flex-col md:flex-row md:gap-2 mx-auto">
        <div class="flex gap-2 items-center">
            <img src="/favicon.ico" alt="logo" width="24" />
            <h1 class="font-bold text-lg">
                <RouterLink to="/">Homework Together</RouterLink>
            </h1>
        </div>
        <NavigationMenuList class="text-slate-500">
            <NavigationMenuItem>
                <RouterLink to="/" :class="navigationMenuTriggerStyle()">
                    Home
                </RouterLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
                <RouterLink to="/user" :class="navigationMenuTriggerStyle()">
                    <span v-if="userStore.isLoggedIn">User ({{ userStore.userBasic.username }})</span>
                    <span v-else class="font-bold text-blue-500">Get started</span>
                </RouterLink>
            </NavigationMenuItem>
        </NavigationMenuList>
    </NavigationMenu>
</template>
