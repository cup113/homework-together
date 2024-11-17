import RouteBase from '../services/route.mjs';
import type { Item, RawOrganization, SharedProgress } from '../types/contract.js';
import type { OrganizationsResponse, PublicItemsResponse, UsersResponse } from '../types/pocketbase-types.js';

export class QueryOrganizationRoute extends RouteBase<OrganizationsResponse[], never> {
    private name: string;

    constructor(name: string) {
        super();
        this.name = name;
    }

    public async handle() {
        const organizations = await this.db.queryOrganization(this.name);
        return this.success(organizations);
    }
}

export class EnterOrganizationRoute extends RouteBase<OrganizationsResponse, 400 | 401> {
    private organizationId: string;

    constructor(authorization: string | undefined, organizationId: string) {
        super();
        this.authorization = authorization;
        this.organizationId = organizationId;
    }

    public async handle() {
        const authResult = await this.auth();
        if (authResult instanceof Error) {
            return authResult;
        }
        try {
            const result = await this.db.enterOrganization(authResult.record.id, this.organizationId);
            this.io().to(result.id).emit("refresh", authResult.record.id, ["share"]);
            return this.success(result);
        } catch (error) {
            return this.convertError(error, [400]);
        }
    }
}

export class CreateOrganizationRoute extends RouteBase<OrganizationsResponse, 400 | 401> {
    private organization: RawOrganization;

    constructor(authorization: string | undefined, organization: RawOrganization) {
        super(authorization);
        this.organization = organization;
    }

    public async handle() {
        const authResult = await this.auth();
        if (authResult instanceof Error) {
            return authResult;
        }
        try {
            const result = await this.db.createOrganization(authResult.record.id, this.organization);
            return this.success(result);
        } catch (error) {
            return this.convertError(error, [400]);
        }
    }
}

export class GetProgressRoute extends RouteBase<Record<string, SharedProgress>, 401 | 404> {
    private organizations: string[];

    constructor(authorization: string | undefined, organizations: string[]) {
        super(authorization);
        this.organizations = organizations;
    }

    private get_map_or_create<T>(map: Map<string, T>, key: string, createValue: () => T): T {
        if (!map.has(key)) {
            map.set(key, createValue());
        }
        return map.get(key)!;
    }

    private map_to_record<T>(map: Map<string, T>): Record<string, T> {
        const result: Record<string, T> = {};
        map.forEach((value, key) => {
            result[key] = value;
        });
        return result;
    }

    private map_to_record_deep<T>(map: Map<string, Map<string, T>>) {
        const result: Record<string, Record<string, T>> = {};
        map.forEach((value, key) => {
            result[key] = this.map_to_record(value);
        });
        return result;
    }

    private handle_one_organization(organizationId: string, users: UsersResponse[], items: Item[]): SharedProgress {
        const mapItems = new Map<string, Map<string, [number, number]>>();
        const mapSubjects = new Map<string, Map<string, [number, number]>>();
        const mapOverall = new Map<string, [number, number]>();

        items.filter(item => item.public.organization === organizationId).forEach((item) => {
            const itemArray = this.get_map_or_create(
                this.get_map_or_create(mapItems, item.publicItem, () => new Map()),
                item.user, () => [0, 0],
            );
            const subjectArray = this.get_map_or_create(
                this.get_map_or_create(mapSubjects, item.public.subject, () => new Map()),
                item.user, () => [0, 0],
            );
            const overallArray = this.get_map_or_create(mapOverall, item.user, () => [0, 0]);

            [itemArray, subjectArray, overallArray].forEach(array => {
                array[0] += item.progress * item.estimateMinutes;
                array[1] += item.estimateMinutes;
            });
        });

        const progress = {
            items: this.map_to_record_deep(mapItems),
            subjects: this.map_to_record_deep(mapSubjects),
            overall: this.map_to_record(mapOverall),
            users: users.filter(user => user.organizations.includes(organizationId)),
        };

        return progress;
    }

    public async handle() {
        const authResult = await this.auth();
        if (authResult instanceof Error) {
            return authResult;
        }
        try {
            const result: Record<string, SharedProgress> = {};
            const items = await this.db.getUserItems(authResult.record.id, {
                thisUserOnly: false,
                organizations: this.organizations,
            });
            const users = await this.db.listUsers();
            this.organizations.forEach(async (organizationId) => {
                result[organizationId] = this.handle_one_organization(organizationId, users, items);
            });
            return this.success(result);
        } catch (error) {
            return this.convertError(error, [401, 404]);
        }
    }
}

export class ListOrganizationItemsRoute extends RouteBase<PublicItemsResponse[], 401 | 404> {
    private organizationId: string;

    constructor(authorization: string | undefined, organizationId: string) {
        super(authorization);
        this.organizationId = organizationId;
    }

    public async handle() {
        const authResult = await this.auth();
        if (authResult instanceof Error) {
            return authResult;
        }
        try {
            const result = await this.db.listOrganizationItems(this.organizationId);
            return this.success(result);
        } catch (error) {
            return this.convertError(error, [401, 404]);
        }
    }
}
