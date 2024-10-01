import { computed } from 'vue';
import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { useNetworkStore } from './network';
import { Sha256 } from '@aws-crypto/sha256-js';

export const useUserStore = defineStore('user', () => {
  const token = useLocalStorage('HT_token', '');
  const isLoggedIn = computed(() => token.value !== '');
  const user = useLocalStorage('HT_user', {
    id: '',
    username: '',
  });

  function sha256(str: string): string {
    const hash = new Sha256();
    hash.update(str);
    const array = hash.digestSync();
    let hex = '';
    array.forEach(byte => {
      hex += byte < 16 ? '0' : '';
      hex += byte.toString(16).toUpperCase();
    });
    return hex;
  }

  async function login(username: string, password: string) {
    const network = useNetworkStore();
    const response = await network.client.auth.login.mutation({
      body: {
        username,
        password: sha256(password),
      },
    });
    if (response.status === 200) {
      token.value = response.body.token;
      user.value.id = response.body.id;
      user.value.username = response.body.username;
      return true;
    } else {
      alert('Login failed.'); // TODO: handle error
      return false;
    }
  };

  return {
    isLoggedIn,
    token,
    user,
    login,
  }
});
