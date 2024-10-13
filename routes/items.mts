import RouteBase from "../services/route.mjs";
import type { Item, RawUserItem, RawPublicItem, ItemsUpdate } from "../types/contract.js";
import { groupBy } from 'es-toolkit/array';

export class GetItemRoute extends RouteBase<Item[], 401> {
    constructor(authorization?: string) {
        super(authorization);
    }

    protected async handle() {
        let userId: string | undefined = undefined;
        if (this.authorization) {
            const authResult = await this.auth();
            if (authResult instanceof Error) {
                return authResult;
            }
            userId = authResult.record.id;
            await this.db.updateUserActivity(userId);
        }
        const items = await this.db.getUserItems(userId);
        return this.success(items);
    }
}

export class UpdateItemRoute extends RouteBase<true, 401 | 403 | 404> {
    private publicData: ItemsUpdate['publicItem'];
    private userData: ItemsUpdate['userItem'];

    constructor(authorization: string | undefined, data: ItemsUpdate) {
        super(authorization);
        this.publicData = data.publicItem;
        this.userData = data.userItem;
    }

    protected async handle() {
        const authResult = await this.auth();
        if (authResult instanceof Error) {
            return authResult;
        }
        try {
            if (this.userData) {
                const { id, ...userData } = this.userData;
                const updatedItem = await this.db.updateUserItem(id, userData);
                await this.db.updateUserActivity(authResult.record.id);
                const progressChanged = [userData.confirmed, userData.estimateMinutes, userData.progress].some(value => value !== undefined);
                if (progressChanged) {
                    const publicItem = updatedItem.expand?.publicItem;
                    const estimateMinutes = updatedItem.confirmed ? updatedItem.estimateMinutes : 0;
                    if (publicItem === undefined) {
                        return this.error("Public item not found", 404);
                    }
                    this.io().to(publicItem.organization).emit("progressUpdated", {
                        itemId: publicItem.id,
                        subjectId: publicItem.subject,
                        userId: authResult.record.id,
                        newProgress: [
                            estimateMinutes * updatedItem.progress,
                            estimateMinutes
                        ],
                    });
                }
            }
            if (this.publicData) {
                const { id, ...publicData } = this.publicData;
                const publicItem = await this.db.updatePublicItem(id, publicData);
                this.io().to(publicItem.organization).emit("refresh", authResult.record.id, ["items"]);
            }
        } catch (error) {
            return this.convertError(error, [403, 404]);
        }
        return this.success(true);
    }
}

export class CreateItemRoute extends RouteBase<Item, 401> {
    private publicData: RawPublicItem;
    private userData: RawUserItem;

    constructor(authorization: string | undefined, publicData: RawPublicItem, userData: RawUserItem) {
        super(authorization);
        this.publicData = publicData;
        this.userData = userData;
    }

    protected async handle() {
        const authResult = await this.auth();
        if (authResult instanceof Error) {
            return authResult;
        }
        const result = await this.db.createItem(authResult.record.id, this.publicData, this.userData);
        this.io().to(this.publicData.organization ?? []).emit("refresh", authResult.record.id, ["items", "share"]);
        return this.success(result);
    }
}

export class DeleteItemsRoute extends RouteBase<true, 401 | 403 | 404> {
    private ids: string[];
    private type: "public" | "user";

    constructor(authorization: string | undefined, ids: string[], type: "public" | "user") {
        super(authorization);
        this.ids = ids;
        this.type = type;
    }

    protected async handle() {
        const authResult = await this.auth();
        if (authResult instanceof Error) {
            return authResult;
        }
        try {
            const deletedItems = await Promise.all(this.ids.map(id => (
                (this.type === "user" ? this.db.deleteUserItem(id) : this.db.deletePublicItem(id))
            )));
            Object.keys(groupBy(deletedItems, item => item.organization)).forEach(id => {
                this.io().to(id).emit("refresh", authResult.record.id, ["items", "share"]);
            });
        } catch (error) {
            return this.convertError(error, [403, 404])
        }
        return this.success(true);
    }
}
