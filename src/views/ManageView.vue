<script setup lang="ts">
import { ref, watch } from 'vue';
import { useThrottle } from '@vueuse/core';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { useUserStore } from '@/stores/user';

const userStore = useUserStore();

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
                                <Button @click="join_organization(organization.id)" v-if="!userStore.user.organizations.some(o => o.id === organization.id)">Join</Button>
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
