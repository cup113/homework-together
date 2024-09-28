import RouteService from '../services/route.mjs';
import type { UserAuth } from '../types/contract.js'

export default class LoginRoute extends RouteService<UserAuth, 401> {
    private username: string;
    private password: string;

    constructor(username: string, password: string) {
        super();
        this.username = username;
        this.password = password;
    }

    protected async handle() {
        try {
            const authResult = await this.db.authWithPassword(this.username, this.password);
            return this.success({ ...authResult.record, token: authResult.token, expand: {} })
        } catch (e) {
            this.logger.info(`Error while authenticating user: ${e}`);
            return this.error("Invalid username or password.", 401)
        }
    }
}
