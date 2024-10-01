<script lang="ts" setup>
import { ref } from 'vue';
import { useUserStore } from '@/stores/user';
import router from '@/router/index';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from '@/components/ui/card';

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
        <form class="flex flex-col gap-2" @submit.prevent="login">
            <Card>
                <CardHeader>
                    <CardTitle>Login</CardTitle>
                </CardHeader>
                <CardContent>
                    <div class="flex items-center">
                        <Label for="username" class="w-28">Username:</Label>
                        <Input type="text" name="username" id="username" v-model="username" required />
                    </div>
                    <div class="flex items-center">
                        <Label for="password" class="w-28">Password:</Label>
                        <Input type="password" name="password" id="password" v-model="password" required />
                    </div>
                </CardContent>
                <CardFooter>
                    <div class="flex justify-center gap-4">
                        <Button>Login</Button>
                        <Button>Register</Button><!--TODO-->
                    </div>
                </CardFooter>
            </Card>
        </form>
    </div>
</template>
