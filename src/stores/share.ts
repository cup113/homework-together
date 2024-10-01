import { defineStore } from 'pinia';
import { reactive, computed } from 'vue';

export const useShareStore = defineStore('share', () => {
    const users = reactive([
        { id: "a3", name: 'John', percentage: 50 },
        { id: "b4", name: 'Jane', percentage: 30 },
        { id: "c5", name: 'Bob', percentage: 70 }
    ]); // TODO fetch from server

    const rankedUsers = computed(() => {
        return users.sort((a, b) => b.percentage - a.percentage).map((user, index) => ({
            ...user,
            rank: index + 1,
        }))
    })

    return {
        users,
        rankedUsers,
    }
});
