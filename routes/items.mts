import RouteBase from "../services/route.mjs";
import type { Item, RawUserItem, RawPublicItem } from "../types/contract.js";
import type { UserItemsRecord } from "../types/pocketbase-types.js";

export class GetItemRoute extends RouteBase<Item[], 401> {
    private token: string | undefined;

    constructor(token?: string) {
        super();
        this.token = token;
    }

    protected async handle() {
        if (this.token) {
            const authResult = await this.auth(this.token);
            if (authResult instanceof Error) {
                return authResult;
            }
        }
        const items = await this.db.getUserItems();
        return this.success(items);
    }
}

export class UpdateUserItemRoute extends RouteBase<true, 401 | 403 | 404> {
    private token: string | undefined;
    private id: string;
    private data: Partial<UserItemsRecord>;

    constructor(token: string | undefined, id: string, data: Partial<UserItemsRecord>) {
        super();
        this.token = token;
        this.id = id;
        this.data = data;
    }

    protected async handle() {
        if (!this.token) {
            return this.error("Missing token", 401);
        }
        const authResult = await this.auth(this.token);
        if (authResult instanceof Error) {
            return authResult;
        }
        try {
            await this.db.updateItem(this.id, this.data);
        } catch (error) {
            return this.convertError(error, [403, 404])
        }
        return this.success(true);
    }
}

export class CreateItemRoute extends RouteBase<Item, 401> {
    private token: string | undefined;
    private publicData: RawPublicItem;
    private userData: RawUserItem;

    constructor(token: string | undefined, publicData: RawPublicItem, userData: RawUserItem) {
        super();
        this.token = token;
        this.publicData = publicData;
        this.userData = userData;
    }

    protected async handle() {
        if (!this.token) {
            return this.error("Missing token", 401);
        }
        const authResult = await this.auth(this.token);
        if (authResult instanceof Error) {
            return authResult;
        }
        const result = await this.db.createItem(authResult.record.id, this.publicData, this.userData);
        return this.success(result);
    }
}
