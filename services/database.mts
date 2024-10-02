import Client from 'pocketbase';
import type { TypedPocketBase, UserItemsResponse, PublicItemsRecord, OrganizationsResponse } from '../types/pocketbase-types.js';
import type { Item, RawPublicItem, RawUserItem, RawOrganization } from '../types/contract.js';

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

    public async register(username: string, password: string) {
        return await this.pb.collection('users').create({
            username,
            password,
            passwordConfirm: password,
            name: username,
        });
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
        const { subject, ...restPublic } = publicResult;
        return {
            ...userResult,
            public: {
                ...restPublic,
                subject: await this.getSubject(subject),
            }
        };
    }

    public async updateItem(id: string, data: Partial<UserItemsResponse>) {
        return await this.pb.collection('userItems').update(id, data, {
            requestKey: this.pb.authStore.token + "#" + id,
        });
    }

    public async listSubjects() {
        return await this.pb.collection('subjects').getFullList({
            requestKey: null,
        });
    }

    public async getSubject(id: string) {
        return await this.pb.collection('subjects').getOne(id, {
            requestKey: null,
        });
    }
}
