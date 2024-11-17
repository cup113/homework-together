<script lang="ts" setup>
import { AlertDialog, AlertDialogTitle, AlertDialogHeader, AlertDialogDescription, AlertDialogContent, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import ItemDisplay from './ItemDisplay.vue';
import { useItemsStore } from '@/stores/items';
import { computed } from 'vue';

const itemsStore = useItemsStore();
const items = computed(() => itemsStore.askingDeleteParams.items);
const type = computed(() => itemsStore.askingDeleteParams.type);

function confirmDelete() {
    itemsStore.deleteItems(items.value.map(item => type.value === 'public' ? item.publicItem : item.id), type.value, true);
    itemsStore.askingDelete = false;
}
</script>

<template>
    <div>
        <AlertDialog v-model:open="itemsStore.askingDelete">
            <AlertDialogContent class="max-h-[90dvh] overflow-y-scroll">
                <AlertDialogHeader>
                    <AlertDialogTitle>项目删除确认</AlertDialogTitle>
                    <AlertDialogDescription>
                        <p>你确认要删除以下 <b>{{ items.length }}</b> 个项目吗？</p>
                        <p>删除后<b>不可恢复</b>！
                            <span v-if="type === 'public'"><b class="text-red-500">所有用户的项目都会被删除！</b></span>
                            <span v-else>只有你的项目会被删除。</span>
                        </p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div>
                    <ItemDisplay v-for="item, i in items" :key="item.id" :item="item" :index="i"></ItemDisplay>
                </div>
                <AlertDialogFooter>
                    <AlertDialogAction @click="confirmDelete">确认删除</AlertDialogAction>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
</template>
