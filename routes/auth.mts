import dayjs from 'dayjs';
import RouteService from '../services/route.mjs';
import type { UserAuth, UserInfo } from '../types/contract.js'

export class LoginRoute extends RouteService<UserAuth, 401> {
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

export class RegisterRoute extends RouteService<UserAuth, 400> {
    private username: string;
    private password: string;

    constructor(username: string, password: string) {
        super();
        this.username = username;
        this.password = password;
    }

    protected async handle() {
        try {
            const user = await this.db.register(this.username, this.password);
            return this.success({ ...user, token: "", expand: {} })
        } catch (e) {
            this.logger.info(`Error while registering user: ${e}`);
            return this.error("Username already exists.", 400)
        }
    }
}

export class CheckUserRoute extends RouteService<UserInfo, 401> {
    constructor(authorization: string | undefined) {
        super(authorization);
    }

    protected async handle() {
        try {
            const authResult = await this.auth();
            if (authResult instanceof Error) {
                return authResult;
            }
            return this.success(await this.db.checkUser());
        } catch (e) {
            this.logger.info(`Error while getting user info: ${e}`);
            return this.error("Unauthorized", 401)
        }
    }
}

export class UpdateUserWorkingRoute extends RouteService<true, 401> {
    private workingOnItemId: string | undefined;

    constructor(authorization: string | undefined, workingOnItemId: string | undefined) {
        super(authorization);
        this.workingOnItemId = workingOnItemId;
    }

    protected async handle() {
        try {
            const authResult = await this.auth();
            if (authResult instanceof Error) {
                return authResult;
            }
            const userId = authResult.record.id;

            const update = this.workingOnItemId ? {
                workingOn: this.workingOnItemId,
                workingOnSince: dayjs().toISOString().replace('T', ' '),
            } : { workingOn: '' };

            await this.db.updateUser(userId, update);
            this.io().to(authResult.record.organizations).emit('userUpdated', Object.assign({ id: userId }, update));
            return this.success(true);

        } catch (e) {
            this.logger.info(`Error while updating user info: ${e}`);
            return this.error("Unauthorized", 401);
        }
    }
}
