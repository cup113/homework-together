<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, navigationMenuTriggerStyle, NavigationMenuLink } from '@/components/ui/navigation-menu';

const userStore = useUserStore();
</script>

<template>
    <NavigationMenu class="px-6 py-2 flex gap-2 border-b">
        <div class="flex gap-2 items-center">
            <img src="/favicon.ico" alt="logo" width="24" />
            <h1 class="font-bold text-lg">Homework Together</h1>
        </div>
        <NavigationMenuList class="text-slate-500">
            <NavigationMenuItem>
                <RouterLink to="/">
                    <NavigationMenuLink :class="navigationMenuTriggerStyle()">Home</NavigationMenuLink>
                </RouterLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
                <RouterLink to="/login">
                    <NavigationMenuLink :class="navigationMenuTriggerStyle()">
                        <span v-if="userStore.isLoggedIn">User ({{ userStore.user.username }})</span>
                        <span v-else>Get started</span>
                    </NavigationMenuLink>
                </RouterLink>
            </NavigationMenuItem>
        </NavigationMenuList>
    </NavigationMenu>
</template>
