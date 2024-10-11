<script lang="ts" setup>
import { computed } from 'vue';
import { StarterKit } from '@tiptap/starter-kit';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import { cn } from '@/lib/utils';
import Placeholder from '@tiptap/extension-placeholder';

const model = defineModel<string>({
    required: true,
});

const props = defineProps<{
    placeholder: string;
    class?: string;
    disabled?: boolean;
}>()

const editor = useEditor({
    content: model.value,
    editable: !props.disabled,
    onUpdate() {
        model.value = editor.value?.getHTML() ?? ' ';
    },
    extensions: [StarterKit, Placeholder.configure()],
});

const css = computed(() => ({ '--placeholder-text': `"${props.placeholder}"` }));
</script>

<template>
    <div :style="css">
        <EditorContent :editor="editor" :class="cn('py-1 px-2 [&_.ProseMirror]:outline-0', props.class)">
        </EditorContent>
    </div>
</template>

<style>
.tiptap .is-empty::before {
    @apply text-zinc-200 h-0 float-left pointer-events-none select-none;
    content: var(--placeholder-text, '');
}
</style>
