<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, navigationMenuTriggerStyle, NavigationMenuLink } from '@/components/ui/navigation-menu';

const userStore = useUserStore();
</script>

<template>
    <NavigationMenu class="mx-auto my-2">
        <NavigationMenuList>
            <NavigationMenuItem>
                <RouterLink to="/">
                    <NavigationMenuLink :class="navigationMenuTriggerStyle()">Home</NavigationMenuLink>
                </RouterLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
                <RouterLink to="/login">
                    <NavigationMenuLink :class="navigationMenuTriggerStyle()">
                        <span v-if="userStore.isLoggedIn">{{ userStore.user.username }}</span>
                        <span v-else>Login</span>
                    </NavigationMenuLink>
                </RouterLink>
            </NavigationMenuItem>
        </NavigationMenuList>
    </NavigationMenu>
</template>
