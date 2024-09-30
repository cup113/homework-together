import RouteBase from "../services/route.mjs";
import type { Item } from "../types/contract.js";

export class GetItemRoute extends RouteBase<Item[], 401> {
    private token: string | undefined;

    constructor(token?: string) {
        super();
        this.token = token;
    }

    protected async handle() {
        try {
            if (this.token) {
                await this.auth(this.token);
            }
            const items = await this.db.getUserItems();
            return this.success(items);
        } catch (error) {
            return this.error("Invalid token", 401);
        }
    }
}
