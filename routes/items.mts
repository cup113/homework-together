import RouteBase from "../services/route.mjs";
import type { Item, RawUserItem, RawPublicItem, ItemsUpdate } from "../types/contract.js";

export class GetItemRoute extends RouteBase<Item[], 401> {
    private token: string | undefined;

    constructor(token?: string) {
        super();
        this.token = token;
    }

    protected async handle() {
        let userId: string | undefined = undefined;
        if (this.token) {
            const authResult = await this.auth(this.token);
            if (authResult instanceof Error) {
                return authResult;
            }
            userId = authResult.record.id;
        }
        const items = await this.db.getUserItems(userId);
        return this.success(items);
    }
}

export class UpdateItemRoute extends RouteBase<true, 401 | 403 | 404> {
    private token: string | undefined;
    private publicData: ItemsUpdate['publicItem'];
    private userData: ItemsUpdate['userItem'];

    constructor(token: string | undefined, publicData: ItemsUpdate['publicItem'], userData: ItemsUpdate['userItem']) {
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
        try {
            if (this.userData) {
                const { id, ...userData } = this.userData;
                await this.db.updateUserItem(id, userData);
            }
            if (this.publicData) {
                const { id, ...publicData } = this.publicData;
                await this.db.updatePublicItem(id, publicData);
            }
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

export class DeleteItemRoute extends RouteBase<true, 401 | 403 | 404> {
    private token: string | undefined;
    private id: string;
    private type: "public" | "user";

    constructor(token: string | undefined, id: string, type: "public" | "user") {
        super();
        this.token = token;
        this.id = id;
        this.type = type;
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
            if (this.type === "user") {
                await this.db.deleteUserItem(this.id);
            } else {
                await this.db.deletePublicItem(this.id);
            }
        } catch (error) {
            return this.convertError(error, [403, 404])
        }
        return this.success(true);
    }
}
