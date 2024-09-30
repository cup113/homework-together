<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
</script>

<template>
    <nav class="flex justify-center gap-4">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/login">
            <span v-if="userStore.isLoggedIn">{{ userStore.user.username }}</span>
            <span v-else>Login</span>
        </RouterLink>
    </nav>
</template>
