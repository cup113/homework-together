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
const passwordConfirm = ref('');

async function login() {
    const success = await userStore.login(username.value, password.value);
    if (success) {
        router.push('/');
    }
}

async function register() {
    if (password.value !== passwordConfirm.value) {
        alert('Passwords do not match');
        return;
    }
    const success = await userStore.register(username.value, password.value);
    if (success) {
        router.push('/');
    }
}

</script>

<template>
    <div class="flex gap-4 justify-center items-center">
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
                    </div>
                </CardFooter>
            </Card>
        </form>
        <form class="flex flex-col gap-2" @submit.prevent="register">
            <Card>
                <CardHeader>
                    <CardTitle>Register</CardTitle>
                </CardHeader>
                <CardContent>
                    <div class="flex items-center">
                        <Label for="username-register" class="w-28">Username:</Label>
                        <Input type="text" name="username" id="username-register" v-model="username" required />
                    </div>
                    <div class="flex items-center">
                        <Label for="password-register" class="w-28">Password:</Label>
                        <Input type="password" name="password" id="password-register" v-model="password" required />
                    </div>
                    <div class="flex items-center">
                        <Label for="password-confirm" class="w-28">Confirm Password:</Label>
                        <Input type="password" name="password-confirm" id="password-confirm" v-model="passwordConfirm"
                            required />
                    </div>
                </CardContent>
                <CardFooter>
                    <div class="flex justify-center gap-4">
                        <Button>Register</Button>
                    </div>
                </CardFooter>
            </Card>
        </form>
        <Card>
            <CardHeader>
                <CardTitle>Organization</CardTitle>
            </CardHeader>
            <CardContent>
                <div v-for="organization in userStore.organizations" :key="organization.id" class="flex items-center gap-2">
                    <div>{{ organization.name }}</div>
                    <div><Button @click="userStore.join_organization(organization.id)">Join</Button></div>
                </div>
            </CardContent>
        </Card>
    </div>
</template>
