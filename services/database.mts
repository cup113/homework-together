import Client from 'pocketbase';
import type { TypedPocketBase, UserItemsResponse, PublicItemsRecord } from '../types/pocketbase-types.js';

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
        const items = await this.pb.collection('userItems').getFullList<UserItemsResponse<{ publicItem: PublicItemsRecord }>>({
            requestKey: this.pb.authStore.token,
            expand: "publicItem",
        }); // TODO: add pagination
        return Promise.all(items.map(async item => {
            const { expand, ...rest } = item;
            if (!expand) {
                throw new Error("Item is missing publicItem expand");
            }
            const publicItem = expand.publicItem;
            const { subject, ...restPublic } = publicItem;
            return {
                ...rest,
                public: {
                    subject: await this.getSubject(subject),
                   ...restPublic,
                },
            }
        }));
    }

    public async getSubject(id: string) {
        return await this.pb.collection('subjects').getOne(id, {
            requestKey: null,
        });
    }
}
