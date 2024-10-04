import RouteBase from '../services/route.mjs';
import type { RawOrganization, SharedProgress } from '../types/contract.js';
import type { OrganizationsResponse } from '../types/pocketbase-types.js';

export class ListOrganizationsRoute extends RouteBase<OrganizationsResponse[], never> {
    public async handle() {
        const organizations = await this.db.listOrganizations(); // 获取所有组织
        return this.success(organizations);
    }
}

export class EnterOrganizationRoute extends RouteBase<OrganizationsResponse, 400 | 401> {
    private token: string | undefined;
    private organizationId: string;

    constructor(token: string | undefined, organizationId: string) {
        super();
        this.token = token;
        this.organizationId = organizationId;
    }

    public async handle() {
        if (!this.token) {
            return this.error('Unauthorized', 401);
        }
        const authResult = await this.auth(this.token);
        if (authResult instanceof Error) {
            return authResult;
        }
        try {
            const result = await this.db.enterOrganization(authResult.record.id, this.organizationId);
            return this.success(result);
        } catch (error) {
            return this.convertError(error, [400]);
        }
    }
}

export class CreateOrganizationRoute extends RouteBase<OrganizationsResponse, 400 | 401> {
    private token: string | undefined;
    private organization: RawOrganization;

    constructor(token: string | undefined, organization: RawOrganization) {
        super();
        this.token = token;
        this.organization = organization;
    }

    public async handle() {
        if (!this.token) {
            return this.error('Unauthorized', 401);
        }
        const authResult = await this.auth(this.token);
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

export class GetProgressRoute extends RouteBase<SharedProgress, 401 | 404> {
    private token: string | undefined;

    constructor(token: string | undefined) {
        super();
        this.token = token;
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

    public async handle() {
        if (!this.token) {
            return this.error('Unauthorized', 401);
        }
        const authResult = await this.auth(this.token);
        if (authResult instanceof Error) {
            return authResult;
        }
        try {
            const items = await this.db.getUserItems(undefined);
            const mapItems = new Map<string, Map<string, [number, number]>>();
            const mapSubjects = new Map<string, Map<string, [number, number]>>();
            const mapOverall = new Map<string, [number, number]>();

            items.forEach((item) => {
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
                users: await this.db.listUsers(),
            };
            return this.success(progress);
        } catch (error) {
            return this.convertError(error, [401, 404]);
        }
    }
}
