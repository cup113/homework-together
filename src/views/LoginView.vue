<script lang="ts" setup>
import { ref } from 'vue';
import { useUserStore } from '@/stores/user';
import router from '@/router/index';

const userStore = useUserStore();
const username = ref(userStore.user.username);
const password = ref('');

async function login() {
    const success = await userStore.login(username.value, password.value);
    if (success) {
        router.push('/');
    }
}
</script>

<template>
    <div class="flex flex-col items-center gap-4">
        <h1 class="text-2xl font-bold">Login</h1>
        <form class="flex flex-col gap-2" @submit.prevent="login">
            <div class="flex">
                <label for="username" class="w-28">Username:</label>
                <input type="text" id="username" name="username" v-model="username" required>
            </div>
            <div class="flex">
                <label for="password" class="w-28">Password:</label>
                <input type="password" id="password" name="password" v-model="password" required>
            </div>
            <div><button>Login</button></div>
        </form>
    </div>
</template>
