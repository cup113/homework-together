<script lang="ts" setup>
import { ref, watch } from 'vue';
import { useUserStore } from '@/stores/user';
import router from '@/router/index';
import { useThrottle } from '@vueuse/core';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const userStore = useUserStore();
const username = ref(userStore.userBasic.username);
const password = ref('');
const passwordConfirm = ref('');

async function login() {
    await userStore.login(username.value, password.value);
}

function logout() {
    userStore.logout();
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

const organizationName = ref('');
const throttledOrganizationName = useThrottle(organizationName, 500);

async function join_organization(organizationId: string) {
    await userStore.join_organization(organizationId);
}

async function create_organization() {
    if (await userStore.create_organization(organizationName.value)) {
        organizationName.value = '';
    }
}

watch(throttledOrganizationName, async value => {
    await userStore.query_organizations(value);
});
</script>

<template>
    <div class="flex gap-4 justify-center items-center">
        <Tabs default-value="login" class="my-2 p-2 flex flex-col">
            <TabsList class="w-full">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
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
                            <div class="flex justify-center gap-4 w-full">
                                <Button>Login</Button>
                                <Button type="button" @click="logout" variant="destructive">Logout</Button>
                            </div>
                        </CardFooter>
                    </Card>
                </form>
            </TabsContent>
            <TabsContent value="register">
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
                                <Input type="password" name="password" id="password-register" v-model="password"
                                    required />
                            </div>
                            <div class="flex items-center">
                                <Label for="password-confirm" class="w-28">Confirm Password:</Label>
                                <Input type="password" name="password-confirm" id="password-confirm"
                                    v-model="passwordConfirm" required />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <div class="flex justify-center gap-4">
                                <Button>Register</Button>
                            </div>
                        </CardFooter>
                    </Card>
                </form>
            </TabsContent>
        </Tabs>
    </div>
    <div class="flex gap-4 justify-center items-center">
        <Tabs default-value="login" class="my-2 p-2 flex flex-col">
            <TabsList class="w-full">
                <TabsTrigger value="join">加入组织</TabsTrigger>
                <TabsTrigger value="register">创建组织</TabsTrigger>
            </TabsList>
            <TabsContent value="join">
                <Card>
                    <CardHeader>
                        <CardTitle>加入组织</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Input type="text" name="organization" placeholder="请输入组织名称" v-model="organizationName" class="mb-2" />
                        <div v-for="organization in userStore.organizations" :key="organization.id"
                            class="flex items-center gap-2">
                            <div>{{ organization.name }}</div>
                            <div>
                                <Button @click="join_organization(organization.id)" v-if="!userStore.user?.organizations.some(o => o.id === organization.id)">Join</Button>
                                <Badge v-else>Joined</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="register">
                <Card>
                    <CardHeader>
                        <CardTitle>创建组织</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div class="flex items-center gap-2">
                            <Input type="text" name="organization" placeholder="请输入组织名称" v-model="organizationName" class="mb-2" />
                            <Button @click="create_organization()">创建</Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
</template>
