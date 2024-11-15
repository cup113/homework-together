<script lang="ts" setup>
import { AlertDialog, AlertDialogTitle, AlertDialogHeader, AlertDialogDescription, AlertDialogContent, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import type { Item } from 'types/contract';
import ItemDisplay from './ItemDisplay.vue';

const open = defineModel<boolean>();
const props = defineProps<{ items: Item[] }>();
const total = props.items.length;
</script>

<template>
    <AlertDialog v-model="open">
        <AlertDialogHeader>
            <AlertDialogTitle>项目删除确认</AlertDialogTitle>
            <AlertDialogDescription>你确认要删除以下 {{ total }} 个项目吗？</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogContent>
            <div>
                <ItemDisplay v-for="item, i in props.items" :key="item.id" :item="item" :index="i"></ItemDisplay>
            </div>
        </AlertDialogContent>
        <AlertDialogFooter>
            <AlertDialogAction @click="open = false">确认删除</AlertDialogAction>
            <AlertDialogCancel>取消</AlertDialogCancel>
        </AlertDialogFooter>
    </AlertDialog>
</template>
