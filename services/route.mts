import { DBService } from "./database.mjs";
import logger from './logger.mjs'
import { HTTPStatusCode } from '@ts-rest/core'

class RouteError<ErrorCode extends HTTPStatusCode> extends Error {
    public status: ErrorCode;

    constructor(message: string, code: ErrorCode) {
        super(message);
        this.status = code;
    }
}

class Success<T> {
    public body: T;

    constructor(body: T) {
        this.body = body;
    }
}

export default abstract class RouteBase<T, ErrorCode extends HTTPStatusCode> {
    protected db: DBService;
    protected logger: typeof logger;

    constructor() {
        this.db = new DBService();
        this.logger = logger;
    }

    protected success(body: T) {
        return new Success(body);
    }

    protected error(message: string, code: ErrorCode) {
        return new RouteError(message, code);
    }

    protected abstract handle(): Promise<Success<T> | RouteError<ErrorCode>>;

    public async getResponse() {
        const result = await this.handle();
        if (result instanceof Success) {
            return {
                status: 200 as const,
                body: result.body
            };
        } else {
            logger.info(`Error: ${result.message}`);
            return {
                status: result.status,
                body: {
                    message: result.message,
                }
            };
        }
    }
}
