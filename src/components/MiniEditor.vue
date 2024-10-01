<script lang="ts" setup>
import { StarterKit } from '@tiptap/starter-kit';
import { useEditor, EditorContent } from '@tiptap/vue-3';

const model = defineModel<string>({
    required: true,
});

defineSlots<{
    default(): unknown;
}>();

const editor = useEditor({
    content: model.value,
    onUpdate() {
        model.value = editor.value?.getHTML() ?? ' ';
    },
    extensions: [StarterKit],
});
</script>

<template>
    <div class="border-2 border-black rounded-lg">
        <div class="bg-gray-200 rounded-t-lg px-2 py-1"><slot></slot></div>
        <EditorContent :editor="editor" class="py-1 px-2 [&_.ProseMirror]:outline-0"></EditorContent>
    </div>
</template>
