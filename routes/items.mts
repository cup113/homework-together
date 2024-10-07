import RouteBase from "../services/route.mjs";
import type { Item, RawUserItem, RawPublicItem, ItemsUpdate } from "../types/contract.js";
import { groupBy } from 'es-toolkit/array';

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

    constructor(token: string | undefined, data: ItemsUpdate) {
        super();
        this.token = token;
        this.publicData = data.publicItem;
        this.userData = data.userItem;
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
                const updatedItem = await this.db.updateUserItem(id, userData);
                const progressChanged = userData.estimateMinutes !== undefined || userData.progress !== undefined;
                if (progressChanged) {
                    const publicItem = updatedItem.expand?.publicItem;
                    if (publicItem === undefined) {
                        return this.error("Public item not found", 404);
                    }
                    this.io().to(publicItem.organization).emit("progressUpdated", {
                        itemId: publicItem.id,
                        subjectId: publicItem.subject,
                        userId: authResult.record.id,
                        newProgress: [
                            updatedItem.estimateMinutes * updatedItem.progress,
                            updatedItem.estimateMinutes
                        ],
                    });
                }
            }
            if (this.publicData) {
                const { id, ...publicData } = this.publicData;
                const publicItem = await this.db.updatePublicItem(id, publicData);
                this.io().to(publicItem.organization).emit("refresh", authResult.record.id);
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
        this.io().to(this.publicData.organization ?? []).emit("refresh", authResult.record.id);
        return this.success(result);
    }
}

export class DeleteItemsRoute extends RouteBase<true, 401 | 403 | 404> {
    private token: string | undefined;
    private ids: string[];
    private type: "public" | "user";

    constructor(token: string | undefined, ids: string[], type: "public" | "user") {
        super();
        this.token = token;
        this.ids = ids;
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
                await Promise.all(this.ids.map(id => this.db.deleteUserItem(id)));
            } else {
                const deletedItems = await Promise.all(this.ids.map(id => this.db.deletePublicItem(id)));
                Object.keys(groupBy(deletedItems, item => item.organization)).forEach(id => {
                    this.io().to(id).emit("refresh", authResult.record.id);
                });
            }
        } catch (error) {
            return this.convertError(error, [403, 404])
        }
        return this.success(true);
    }
}
