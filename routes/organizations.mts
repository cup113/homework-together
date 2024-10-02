import RouteBase from '../services/route.mjs';
import type { RawOrganization } from '../types/contract.js';
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

// export class GetSharedRoute extends RouteBase<SharedProgress, 401 | 404> {
//     private token: string | undefined;
//     private organizationId: string;
// }
