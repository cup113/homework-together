import Client from 'pocketbase';
import type { TypedPocketBase } from '../types/pocketbase-types.js';

export class DBService {
    protected pb: TypedPocketBase;

    constructor() {
        this.pb = new Client("http://localhost:8090");
    }

    public async authWithToken(token: string) {
        this.pb.authStore.save(token);
        const auth = await this.pb.collection('users').authRefresh();
        return auth;
    }

    public async authWithPassword(username: string, password: string) {
        const auth = await this.pb.collection('users').authWithPassword(username, password);
        await this.pb.collection('users').authRefresh();
        return auth;
    }

    public async getUserItems() {
        return await this.pb.collection('userItems').getFullList({
            requestKey: this.pb.authStore.token,
        }); // TODO: add pagination
    }
}
