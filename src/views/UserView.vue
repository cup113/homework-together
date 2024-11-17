<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { useUserStore } from '@/stores/user';
import router from '@/router/index';
import { useThrottle } from '@vueuse/core';
import dayjs from 'dayjs';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { createCache } from '@/lib/cache';
import type { UserUpdate } from 'types/contract';

const userStore = useUserStore();
const username = ref(userStore.userBasic.username);
const password = ref('');
const passwordConfirm = ref('');
const source = computed(() => ({
    name: userStore.user?.name,
    goal: userStore.user?.goal,
}));

const cache = createCache(() => {
    return {
        name: source.value.name,
        goal: source.value.goal ? dayjs(source.value.goal).format('YYYY-MM-DD HH:mm') : undefined,
    };
}, diff => {
    const userUpdate: UserUpdate = {};
    const UPDATERS = {
        goal: value => userUpdate.goal = dayjs(value).toISOString(),
        name: value => userUpdate.name = value,
    } satisfies { [K in keyof typeof cache.value]: (value: typeof cache.value[K]) => void };
    Object.entries(diff).forEach(([key, value]) => {
        // @ts-expect-error Typescript limitation about inferring entry types
        UPDATERS[key](value);
    });
    userStore.update_user(userUpdate);
}, 1000);

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
    <div class="flex flex-col gap-4 justify-center items-center">
        <Tabs default-value="login-user" class="my-2 p-2 flex flex-col">
            <TabsList class="w-full">
                <TabsTrigger value="login-user">登录</TabsTrigger>
                <TabsTrigger value="register-user">注册</TabsTrigger>
                <TabsTrigger value="join-organization">加入组织</TabsTrigger>
                <TabsTrigger value="register-organization">创建组织</TabsTrigger>
            </TabsList>
            <TabsContent value="login-user">
                <form class="flex flex-col gap-2" @submit.prevent="login">
                    <Card>
                        <CardHeader>
                            <CardTitle>登录</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div class="flex items-center">
                                <Label for="username" class="w-28">用户名:</Label>
                                <Input type="text" name="username" id="username" v-model="username" required />
                            </div>
                            <div class="flex items-center">
                                <Label for="password" class="w-28">密码:</Label>
                                <Input type="password" name="password" id="password" v-model="password" required />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <div class="flex justify-center gap-4 w-full">
                                <Button>登录</Button>
                                <Button type="button" @click="logout" variant="destructive">登出</Button>
                            </div>
                        </CardFooter>
                    </Card>
                </form>
            </TabsContent>
            <TabsContent value="register-user">
                <form class="flex flex-col gap-2" @submit.prevent="register">
                    <Card>
                        <CardHeader>
                            <CardTitle>注册</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div class="flex items-center">
                                <Label for="username-register" class="w-28">用户名:</Label>
                                <Input type="text" name="username" id="username-register" v-model="username" required />
                            </div>
                            <div class="flex items-center">
                                <Label for="password-register" class="w-28">密码:</Label>
                                <Input type="password" name="password" id="password-register" v-model="password"
                                    required />
                            </div>
                            <div class="flex items-center">
                                <Label for="password-confirm" class="w-28">确认密码:</Label>
                                <Input type="password" name="password-confirm" id="password-confirm"
                                    v-model="passwordConfirm" required />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <div class="flex justify-center gap-4 w-full">
                                <Button>注册</Button>
                            </div>
                        </CardFooter>
                    </Card>
                </form>
            </TabsContent>
            <TabsContent value="join-organization">
                <Card>
                    <CardHeader>
                        <CardTitle>加入组织</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Input type="text" name="organization" placeholder="请输入组织名称" v-model="organizationName"
                            class="mb-2" />
                        <div v-for="organization in userStore.organizations" :key="organization.id"
                            class="flex items-center gap-2">
                            <div>{{ organization.name }}</div>
                            <div>
                                <Button @click="join_organization(organization.id)"
                                    v-if="!userStore.user?.organizations.some(o => o.id === organization.id)">加入</Button>
                                <Badge v-else>已加入</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="register-organization">
                <Card>
                    <CardHeader>
                        <CardTitle>创建组织</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div class="flex items-center gap-2">
                            <Input type="text" name="organization" placeholder="请输入组织名称" v-model="organizationName"
                                class="mb-2" />
                            <Button @click="create_organization()">创建</Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
        <Card>
            <CardHeader>
                <CardTitle>个人信息管理</CardTitle>
            </CardHeader>
            <CardContent>
                <div class="flex flex-col gap-2">
                    <div class="flex items-center gap-2">
                        <div class="w-24">用户名：</div>
                        <Input type="text" name="username" :model-value="userStore.userBasic.username" disabled />
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-24">昵称：</div>
                        <Input type="text" name="nickname" v-model="cache.name" />
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-24">目标：</div>
                        <Input type="datetime-local" name="goal" v-model="cache.goal" />
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
</template>
