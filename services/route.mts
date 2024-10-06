import { DBService } from "./database.mjs";
import logger from './logger.mjs';
import { io } from "./ws.mjs";
import { ClientResponseError, type RecordAuthResponse } from 'pocketbase'
import type { UsersResponse } from '../types/pocketbase-types.js';
import { HTTPStatusCode } from '@ts-rest/core';

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

    protected io() {
        return io();
    }

    protected success(body: T) {
        return new Success(body);
    }

    protected error(message: string, code: ErrorCode) {
        return new RouteError(message, code);
    }

    protected includeCode<T extends number>(codes: T[], code: number): code is T {
        return (codes as number[]).includes(code);
    }

    protected convertError<ErrorStatusCode extends ErrorCode>(error: unknown, codes: ErrorStatusCode[]): RouteError<ErrorCode> {
        if (error instanceof ClientResponseError && this.includeCode(codes, error.status)) {
            return this.error(error.message, error.status);
        } else if (error instanceof Error) {
            throw error;
        }else {
            throw new Error(new String(error).valueOf());
        }
    }

    protected async auth(authorization: string): Promise<RecordAuthResponse<UsersResponse> | RouteError<401>> {
        if (!authorization.startsWith('Bearer ')) {
            return new RouteError("Invalid authorization header", 401)
        }
        const token = authorization.slice("Bearer ".length);
        try {
            return this.db.authWithToken(token);
        } catch {
            return new RouteError("Invalid token", 401)
        }
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
