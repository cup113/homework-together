import { computed, ref } from 'vue';
import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { useNetworkStore } from './network';
import { Sha256 } from '@aws-crypto/sha256-js';
import type { OrganizationsResponse } from 'types/pocketbase-types';

export const useUserStore = defineStore('user', () => {
  const token = useLocalStorage('HT_token', '');
  const isLoggedIn = computed(() => token.value !== '');
  const user = useLocalStorage('HT_user', {
    id: '',
    username: '',
    organizations: new Array<{ name: string, id: string }>(),
  });
  const organizations = ref(new Array<OrganizationsResponse>())

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

  async function register(username: string, password: string) {
    const network = useNetworkStore();
    const response = await network.client.auth.register.mutation({
      body: {
        username,
        password: sha256(password),
      },
    });
    if (response.status === 200) {
      return await login(username, password);
    } else {
      alert('Registration failed.'); // TODO: handle error
      return false;
    }
  }

  async function list_organizations() {
    const network = useNetworkStore();
    const response = await network.client.organizations.list.query({});
    if (response.status === 200) {
      organizations.value = response.body;
    } else {
      console.error(response.body);
      alert('Failed to list organizations.'); // TODO: handle error
    }
  }

  async function join_organization(organizationId: string) {
    const network = useNetworkStore();
    const response = await network.client.organizations.join.mutation({
      body: { organizationId }
    });
    if (response.status === 200) {
      user.value.organizations.push({ name: response.body.name, id: organizationId });
      return true;
    } else {
      console.error(response.body);
      alert('Failed to join organization.'); // TODO: handle error
      return false;
    }
  }

  list_organizations();

  return {
    isLoggedIn,
    token,
    user,
    organizations,
    login,
    register,
    join_organization,
  }
});
