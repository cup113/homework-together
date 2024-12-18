import { computed, nextTick, ref, watch } from 'vue';
import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { useNetworkStore } from './network';
import { Sha256 } from '@aws-crypto/sha256-js';
import type { OrganizationsResponse } from '@/../types/pocketbase-types';
import type { UserInfo, UserUpdate } from 'types/contract';

const initialUser = () => ({
  id: '',
  username: '',
})

export const useUserStore = defineStore('user', () => {
  const token = useLocalStorage('HT_token', '');
  const isLoggedIn = computed(() => token.value !== '');
  const userBasic = useLocalStorage('HT_user', initialUser());
  const user = ref<UserInfo | undefined>();
  const organizations = ref(new Array<OrganizationsResponse>());
  const checked = ref(false);
  const onlineUserIds = ref(new Array<string>());

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

  async function check() {
    checked.value = false;
    const network = useNetworkStore();
    if (!isLoggedIn.value) {
      return;
    }
    const response = await network.client.auth.check.mutation({ body: {} });
    if (response.status === 401) {
      logout();
      console.error(response.body.message);
      alert('Session expired. Please log in again.');
      return;
    } else if (response.status !== 200) {
      console.error(response.body);
      alert('Failed to check session.');
      return;
    }
    token.value = response.body.token;
    user.value = response.body;
    userBasic.value.username = response.body.username;
    userBasic.value.id = response.body.id;
    checked.value = true;
  }

  function onChecked(func: CallableFunction) {
    if (checked.value) {
      func();
    }
    watch(checked, newValue => {
      if (newValue) {
        func();
      }
    });
  }

  function logout() {
    token.value = '';
    userBasic.value = initialUser();
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
      userBasic.value.id = response.body.id;
      userBasic.value.username = response.body.username;
      location.assign('/manage');
    } else {
      alert('Login failed.');
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
      alert('Registration failed.');
      return false;
    }
  }

  async function query_organizations(name: string) {
    const network = useNetworkStore();
    const response = await network.client.organizations.query.query({ query: { name } });
    if (response.status === 200) {
      organizations.value = response.body;
    } else {
      console.error(response.body);
      alert('Failed to list organizations.');
    }
  }

  async function join_organization(organizationId: string) {
    const network = useNetworkStore();
    const response = await network.client.organizations.join.mutation({
      body: { organizationId }
    });
    if (response.status === 200) {
      if (user.value === undefined) {
        alert('User not found');
        throw new Error('User not found');
      }
      user.value.organizations.push(response.body);
      return true;
    } else {
      console.error(response.body);
      alert('Failed to join organization.');
      return false;
    }
  }

  async function create_organization(name: string) {
    const network = useNetworkStore();
    const response = await network.client.organizations.register.mutation({
      body: { name }
    });
    if (response.status === 200) {
      if (user.value === undefined) {
        alert('User not found');
        throw new Error('User not found');
      }
      user.value.organizations.push(response.body);
      return true;
    } else {
      console.error(response.body);
      alert('Failed to add organization.');
      return false;
    }
  }

  async function work_on(workingOnItemId?: string) {
    const network = useNetworkStore();
    const response = await network.client.auth.working.mutation({
      body: { workingOnItemId },
    });
    if (response.status !== 200) {
      console.error(response.body);
      alert('Failed to work on item.');
      return false;
    }
    return true;
  }

  async function update_user(userUpdate: UserUpdate) {
    const network = useNetworkStore();
    const response = await network.client.auth.update.mutation({
      body: userUpdate,
    });
    if (response.status !== 200) {
      console.error(response.body);
      alert('Failed to update user.');
      return false;
    }
    if (userUpdate.name !== undefined) {
      if (!user.value) {
        alert('User not found');
        return;
      }
      user.value.name = userUpdate.name;
    }
    if (userUpdate.goal !== undefined) {
      if (!user.value) {
        alert('User not found');
        return;
      }
      user.value.goal = userUpdate.goal;
    }
    return true;
  }

  nextTick(() => {
    check();
  });

  return {
    isLoggedIn,
    token,
    user,
    userBasic,
    organizations,
    onlineUserIds,
    check,
    onChecked,
    logout,
    login,
    register,
    update_user,
    query_organizations,
    join_organization,
    create_organization,
    work_on,
  }
});
