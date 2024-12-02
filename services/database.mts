import Client from 'pocketbase';
import type { TypedPocketBase, UserItemsResponse, OrganizationsResponse, UsersResponse, UserItemsRecord, PublicItemsResponse, PublicItemsRecord, OrganizationsRecord, UsersRecord } from '../types/pocketbase-types.js';
import type { Item, RawPublicItem, RawUserItem, RawOrganization } from '../types/contract.js';
import dayjs from 'dayjs';
import { invariant } from 'es-toolkit/util';

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

    public async removeUser(userId: string) {
        return await this.pb.collection('users').delete(userId);
    }

    public async listUsers(): Promise<UsersResponse[]> {
        return await this.pb.collection('users').getFullList();
    }

    public async updateUser(userId: string, data: Partial<UsersRecord>) {
        return await this.pb.collection('users').update(userId, data);
    }

    public async registerOrganization(userId: string, organizationData: RawOrganization) {
        return await this.pb.collection('organizations').create({
            ...organizationData,
            leader: userId,
        } satisfies OrganizationsRecord)
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
                confirmed: publicItem.range === "all",
                progress: 0,
            } satisfies UserItemsRecord, { requestKey: publicItem.id });
        }));
        return await this.pb.collection('organizations').getOne(organizationId);
    }

    public async createOrganization(userId: string, organizationData: RawOrganization): Promise<OrganizationsResponse> {
        const { name, ...rest } = organizationData;
        return await this.pb.collection('organizations').create({
            name: this.sanitize(name),
            ...rest,
            leader: userId,
        } satisfies OrganizationsRecord);
    }

    public async listOrganizationItems(organizationId: string): Promise<PublicItemsResponse[]> {
        return await this.pb.collection('publicItems').getFullList({
            filter: `organization = "${organizationId}"`,
        });
    }

    public async checkUser() {
        const authResult = await this.pb.collection('users').authRefresh();
        if (!this.pb.authStore.isValid) {
            throw new Error("Invalid token");
        }
        const user = await this.pb.collection('users').getOne(authResult.record.id, {
            expand: "organizations",
        }) satisfies UsersResponse<{ organizations: OrganizationsResponse[] }>;
        const { expand, ...userRest } = user;
        const organizations = expand?.organizations ?? [];

        await this.pb.collection('users').update(user.id, {
            lastCheck: dayjs().toISOString(),
        } satisfies Required<Pick<UsersRecord, 'lastCheck'>>);

        return {
            ...userRest,
            organizations,
            token: authResult.token,
        };
    }

    public async updateUserActivity(userId: string) {
        return await this.pb.collection('users').update(userId, {
            lastActive: dayjs().toISOString().replace("T", " "),
        } satisfies Required<Pick<UsersRecord, 'lastActive'>>);
    }

    public async getUserItems(userId: string, config: {
        thisUserOnly: boolean,
        organizations?: string[],
    }): Promise<Item[]> {

        const SHARED_FILTER_BASE = "user.lastActive >= created && confirmed = true";

        const filter = config.thisUserOnly ? `user.id = "${userId}"` : (
            (config.organizations && config.organizations.length) ? `(${SHARED_FILTER_BASE}) && (${config.organizations.map(org => `publicItem.organization.id = "${org}"`).join(" || ")})` : SHARED_FILTER_BASE
        );

        const items = await this.pb.collection('userItems').getFullList<UserItemsResponse<{ publicItem: PublicItemsResponse }>>({
            expand: "publicItem",
            filter,
        });
        return items.map(item => {
            const { expand, ...rest } = item;
            invariant(expand, "Item is missing publicItem expand");
            const publicItem = expand.publicItem;
            return {
                ...rest,
                public: publicItem,
            }
        });
    }

    public async createItem(userId: string, publicItem: RawPublicItem, userItem: RawUserItem): Promise<Item> {
        const publicResult = await this.pb.collection('publicItems').create({
            ...publicItem,
            author: userId,
        });
        const userResult = await this.pb.collection('userItems').create({
            ...userItem,
            publicItem: publicResult.id,
            user: userId,
            confirmed: true,
        } satisfies UserItemsRecord, { requestKey: userId });
        if (publicItem.organization && publicItem.range !== "private") {
            await this.createFellowItem(userId, publicResult);
        }
        return {
            ...userResult,
            public: publicResult,
        };
    }

    public async createFellowItem(userId: string, publicItem: PublicItemsResponse) {
        const users = await this.pb.collection('users').getFullList({
            filter: `organizations.id ?= "${this.sanitize(publicItem.organization)}"`
        });
        return await Promise.all(users.filter(user => user.id !== userId).map(user => {
            // TODO make sure user hasn't had this item before
            return this.pb.collection('userItems').create({
                estimateMinutes: publicItem.estimateMinutes,
                publicItem: publicItem.id,
                user: user.id,
                confirmed: publicItem.range === "all",
                progress: 0,
            } satisfies UserItemsRecord, { requestKey: publicItem.id + user.id });
        }));
    }

    public async updateUserItem(id: string, data: Partial<UserItemsRecord>): Promise<UserItemsResponse<{ publicItem: PublicItemsResponse }>> {
        return await this.pb.collection('userItems').update(id, data, {
            requestKey: id,
            expand: "publicItem",
        });
    }

    public async updatePublicItem(userId: string, id: string, data: Partial<PublicItemsRecord>) {
        const originalItem = await this.pb.collection('publicItems').getOne(id, { requestKey: null });
        let newItem: PublicItemsResponse | null = null;
        const getNewItem = async () => {
            if (!newItem) {
                const _newItem = await this.pb.collection('publicItems').update(id, data, { requestKey: id });
                newItem = _newItem;
                return newItem;
            }
            return newItem;
        }

        if ('organization' in data) {
            // TODO permission check
            const organization = data.organization;
            if (organization !== originalItem.organization) {
                const originalOrganization = originalItem.organization;
                await this.deleteUserItemsOfPublicItem(id, `user.organizations.id:each != "${originalOrganization}"`);
                if (organization) {
                    await this.createFellowItem(userId, await getNewItem());
                }
            }
        }
        if (data.range !== undefined) {
            const create_fellow = async () => { this.createFellowItem(userId, await getNewItem()); };
            const delete_fellow = async () => { this.deleteUserItemsOfPublicItem(id, `user.id != "${userId}"`); };
            const confirm_fellow = async () => {
                const fellowItems = await this.pb.collection('userItems').getFullList({
                    filter: `publicItem.id = "${id}" && user.id != "${userId}"`,
                });
                await Promise.all(fellowItems.map(item => this.pb.collection('userItems').update(
                    item.id, { confirmed: true }, { requestKey: item.id })));
            };
            const un_confirm_fellow = async () => {
                const fellowItems = await this.pb.collection('userItems').getFullList({
                    filter: `publicItem.id = "${id}" && user.id != "${userId}" && progress = 0`,
                });
                await Promise.all(fellowItems.map(item => this.pb.collection('userItems').update(
                    item.id, { confirmed: false }, { requestKey: item.id })));
            };

            const APPROACH_MAP = {
                'private': {
                    'private': null,
                    'some': create_fellow,
                    'all': create_fellow,
                },
                'some': {
                    'private': delete_fellow,
                    'some': null,
                    'all': confirm_fellow,
                },
                'all': {
                    'private': delete_fellow,
                    'some': un_confirm_fellow,
                    'all': null,
                }
            };
            const approach = APPROACH_MAP[(await getNewItem()).range][originalItem.range];
            if (approach) {
                await approach();
            }
        }
        // TODO add emit information
        return await getNewItem();
    }

    public async deleteUserItem(id: string) {
        const publicId = (await this.pb.collection('userItems').getOne(id, { requestKey: null })).publicItem;
        const publicItem = await this.pb.collection('publicItems').getOne(publicId, { requestKey: null });
        await this.pb.collection('userItems').delete(id, { requestKey: id });
        return {
            organization: publicItem.organization,
        }
    }

    public async deleteUserItemsOfPublicItem(publicItem: string, extraFilter?: string) {
        const userItems = await this.pb.collection('userItems').getFullList({
            filter: `publicItem.id = "${publicItem}"` + (extraFilter ? ` && ${extraFilter}` : ""),
            requestKey: null,
        });
        await Promise.all(userItems.map(item => this.deleteUserItem(item.id)));
    }

    public async deletePublicItem(id: string) {
        await this.deleteUserItemsOfPublicItem(id);
        const item = await this.pb.collection('publicItems').getOne(id, { requestKey: id });
        await this.pb.collection('publicItems').delete(id, { requestKey: id });
        return {
            organization: item.organization
        };
    }

    public async listSubjects() {
        return await this.pb.collection('subjects').getFullList({ requestKey: null });
    }
}
