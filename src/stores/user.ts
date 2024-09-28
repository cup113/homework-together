import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { useNetworkStore } from './network';

export const useUserStore = defineStore('user', () => {
  const token = useLocalStorage('HT_token', '');
  const user = useLocalStorage('HT_user', {
    id: '',
    username: '',
    name: '',
  });

  async function login(username: string, password: string) {
    const network = useNetworkStore();
    return await network.client.auth.login.mutation({
      body: {
        username,
        password,
      },
    })
  };

  return {
    token,
    user,
    login,
  }
});
