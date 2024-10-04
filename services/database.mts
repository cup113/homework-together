import Client from 'pocketbase';
import type { TypedPocketBase, UserItemsResponse, OrganizationsResponse, UsersResponse, UserItemsRecord, PublicItemsResponse, PublicItemsRecord } from '../types/pocketbase-types.js';
import type { Item, RawPublicItem, RawUserItem, RawOrganization } from '../types/contract.js';
import dayjs from 'dayjs';

export class DBService {
    protected pb: TypedPocketBase;

    constructor() {
        this.pb = new Client("http://localhost:8090");
    }

    public async authWithToken(token: string) {
        this.pb.authStore.save(token);
        const auth = await this.pb.collection('users').authRefresh();
        if (!this.pb.authStore.isValid) {
            throw new Error("Invalid token");
        }
        return auth;
    }

    public async authWithPassword(username: string, password: string) {
        const auth = await this.pb.collection('users').authWithPassword(username, password);
        await this.pb.collection('users').authRefresh();
        return auth;
    }

    public async register(username: string, password: string) {
        return await this.pb.collection('users').create({
            username,
            password,
            passwordConfirm: password,
            name: username,
        });
    }

    public async listUsers(): Promise<UsersResponse[]> {
        return await this.pb.collection('users').getFullList();
    }

    public async listOrganizations(): Promise<OrganizationsResponse[]> {
        return await this.pb.collection('organizations').getFullList();
    }

    public async enterOrganization(userId: string, organizationId: string) {
        await this.pb.collection('users').update(userId, {
            "organizations+": organizationId,
        });
        return await this.pb.collection('organizations').getOne(organizationId);
    }

    public async createOrganization(userId: string, organizationData: RawOrganization): Promise<OrganizationsResponse> {
        return await this.pb.collection('organizations').create({
            ...organizationData,
            leader: userId,
        });
    }

    public async checkUser() {
        const EARLY = "2000-01-01 00:00:00.000";

        const authResult = await this.pb.collection('users').authRefresh();
        if (!this.pb.authStore.isValid) {
            throw new Error("Invalid token");
        }
        const user = await this.pb.collection('users').getOne(authResult.record.id, {
            expand: "organizations",
            requestKey: this.pb.authStore.token,
        }) as UsersResponse<{ organizations: OrganizationsResponse[] }>;
        const { expand, ...userRest } = user;
        const organizations = expand?.organizations ?? []

        const lastDate = dayjs((await this.pb.collection('userItems').getList(1, 1, {
            filter: `user.id = "${user.id}"`,
            sort: "-updated",
            requestKey: this.pb.authStore.token,
        })).items[0]?.updated ?? EARLY);
        const lastDateStr = lastDate.toISOString().replace("T", " ").replace("Z", "");
        const newItems = await this.pb.collection('publicItems').getFullList({
            filter: `updated >= "${lastDateStr}"`,
            requestKey: this.pb.authStore.token,
        });
        await Promise.all(newItems.map(async item => {
            this.pb.collection('userItems').create({
                publicItem: item.id,
                user: user.id,
                estimateMinutes: item.estimateMinutes,
            } satisfies UserItemsRecord, { requestKey: null });
        }));

        return {
            ...userRest,
            organizations,
            token: authResult.token,
        };
    }

    public async getUserItems(userId?: string): Promise<Item[]> {
        const items = await this.pb.collection('userItems').getFullList<UserItemsResponse<{ publicItem: PublicItemsResponse }>>(Object.assign({
            requestKey: this.pb.authStore.token,
            expand: "publicItem",
        }, userId ? { filter: `user.id = "${userId}"` } : {}));
        return Promise.all(items.map(async item => {
            const { expand, ...rest } = item;
            if (!expand) {
                throw new Error("Item is missing publicItem expand");
            }
            const publicItem = expand.publicItem;
            return {
                ...rest,
                public: publicItem,
            }
        }));
    }

    public async createItem(userId: string, publicItem: RawPublicItem, userItem: RawUserItem): Promise<Item> {
        const publicResult = await this.pb.collection('publicItems').create({
            ...publicItem,
            author: userId,
        }, {
            requestKey: this.pb.authStore.token,
        });
        const userResult = await this.pb.collection('userItems').create({
            ...userItem,
            publicItem: publicResult.id,
            user: userId,
        }, {
            requestKey: this.pb.authStore.token + publicItem.description,
        });
        return {
            ...userResult,
            public: publicResult,
        };
    }

    public async updateUserItem(id: string, data: Partial<UserItemsRecord>) {
        return await this.pb.collection('userItems').update(id, data, {
            requestKey: this.pb.authStore.token + "#" + id,
        });
    }

    public async updatePublicItem(id: string, data: Partial<PublicItemsRecord>) {
        return await this.pb.collection('publicItems').update(id, data, {
            requestKey: this.pb.authStore.token + "#" + id,
        });
    }

    public async deleteUserItem(id: string) {
        return await this.pb.collection('userItems').delete(id, {
            requestKey: this.pb.authStore.token + "#" + id,
        });
    }

    public async deletePublicItem(id: string) {
        const userItems = await this.pb.collection('userItems').getFullList({
            filter: `publicItem.id = "${id}"`,
            requestKey: this.pb.authStore.token + "#" + id,
        });
        await Promise.all(userItems.map(item => this.deleteUserItem(item.id)));
        return await this.pb.collection('publicItems').delete(id, {
            requestKey: this.pb.authStore.token + "#" + id,
        });
    }

    public async listSubjects() {
        return await this.pb.collection('subjects').getFullList({
            requestKey: null,
        });
    }
}
