import Client from 'pocketbase';
import type { TypedPocketBase, UserItemsResponse, OrganizationsResponse, UsersResponse, UserItemsRecord, PublicItemsResponse, PublicItemsRecord, OrganizationsRecord, UsersRecord } from '../types/pocketbase-types.js';
import type { Item, RawPublicItem, RawUserItem, RawOrganization } from '../types/contract.js';
import dayjs from 'dayjs';

export class DBService {
    protected pb: TypedPocketBase;

    constructor() {
        this.pb = new Client("http://localhost:8090");
    }

    protected sanitize(str: string) {
        return str.replace(/["\\]/g, "");
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

    public async registerOrganization(userId: string, organizationData: RawOrganization) {
        return await this.pb.collection('organizations').create({
            ...organizationData,
            leader: userId,
        } as OrganizationsRecord)
    }

    public async queryOrganization(keyword: string): Promise<OrganizationsResponse[]> {
        return await this.pb.collection('organizations').getFullList({
            filter: `name = "${this.sanitize(keyword)}"`
        });
    }

    public async enterOrganization(userId: string, organizationId: string) {
        await this.pb.collection('users').update(userId, {
            "organizations+": organizationId,
        });
        const publicItems = await this.pb.collection('publicItems').getFullList({
            filter: `organization = "${organizationId}"`,
        });
        await Promise.all(publicItems.map(async publicItem => {
            await this.pb.collection('userItems').create({
                user: userId,
                publicItem: publicItem.id,
                estimateMinutes: publicItem.estimateMinutes,
                confirmed: false,
                progress: 0,
            } as UserItemsRecord, {
                requestKey: publicItem.id,
            });
        }));
        return await this.pb.collection('organizations').getOne(organizationId);
    }

    public async createOrganization(userId: string, organizationData: RawOrganization): Promise<OrganizationsResponse> {
        const { name, ...rest } = organizationData;
        return await this.pb.collection('organizations').create({
            name: this.sanitize(name),
            ...rest,
            leader: userId,
        } as OrganizationsRecord);
    }

    public async checkUser() {
        const authResult = await this.pb.collection('users').authRefresh();
        if (!this.pb.authStore.isValid) {
            throw new Error("Invalid token");
        }
        const user = await this.pb.collection('users').getOne(authResult.record.id, {
            expand: "organizations",
        }) as UsersResponse<{ organizations: OrganizationsResponse[] }>;
        const { expand, ...userRest } = user;
        const organizations = expand?.organizations ?? [];

        await this.pb.collection('users').update(user.id, {
            lastCheck: dayjs().toISOString(),
        } as Required<Pick<UsersRecord, 'lastCheck'>>);

        return {
            ...userRest,
            organizations,
            token: authResult.token,
        };
    }

    public async getUserItems(userId?: string): Promise<Item[]> {
        const items = await this.pb.collection('userItems').getFullList<UserItemsResponse<{ publicItem: PublicItemsResponse }>>(Object.assign({
            expand: "publicItem",
        }, userId ? { filter: `user.id = "${userId}"` } : { filter: "confirmed = true" }));
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
        });
        if (publicItem.organization && publicItem.range !== "private") {
            const users = await this.pb.collection('users').getFullList({
                filter: `organizations.id ?= "${this.sanitize(publicItem.organization)}"`
            });
            await Promise.all(users.filter(user => user.id !== userId).map(user => {
                return this.pb.collection('userItems').create({
                    estimateMinutes: publicItem.estimateMinutes,
                    publicItem: publicResult.id,
                    user: user.id,
                    confirmed: false,
                    progress: 0,
                } as UserItemsRecord, {
                    requestKey: user.id,
                });
            }));
        }
        const userResult = await this.pb.collection('userItems').create({
            ...userItem,
            publicItem: publicResult.id,
            user: userId,
            confirmed: true,
        } as UserItemsRecord, {
            requestKey: userId,
        });
        return {
            ...userResult,
            public: publicResult,
        };
    }

    public async updateUserItem(id: string, data: Partial<UserItemsRecord>): Promise<UserItemsResponse<{ publicItem: PublicItemsResponse }>> {
        return await this.pb.collection('userItems').update(id, data, {
            requestKey: id,
            expand: "publicItem",
        });
    }

    public async updatePublicItem(id: string, data: Partial<PublicItemsRecord>) {
        return await this.pb.collection('publicItems').update(id, data, {
            requestKey: id,
        });
    }

    public async deleteUserItem(id: string) {
        const publicId = (await this.pb.collection('userItems').getOne(id, {
            requestKey: 'delete-user-item-' + id,
        })).publicItem;
        const publicItem = await this.pb.collection('publicItems').getOne(publicId, {
            requestKey: 'delete-user-item-' + id,
        });
        await this.pb.collection('userItems').delete(id, {
            requestKey: id,
        });
        return {
            organization: publicItem.organization,
        }
    }

    public async deletePublicItem(id: string) {
        const userItems = await this.pb.collection('userItems').getFullList({
            filter: `publicItem.id = "${id}"`,
            requestKey: id,
        });
        await Promise.all(userItems.map(item => this.deleteUserItem(item.id)));
        const item = await this.pb.collection('publicItems').getOne(id, {
            requestKey: id,
        });
        await this.pb.collection('publicItems').delete(id, {
            requestKey: id,
        });
        return {
            organization: item.organization
        };
    }

    public async listSubjects() {
        return await this.pb.collection('subjects').getFullList({
            requestKey: null,
        });
    }
}
