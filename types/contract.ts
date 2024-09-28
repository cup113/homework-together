import type { UsersRecord, AuthSystemFields } from './pocketbase-types.js';
import z from 'zod';
import { initContract } from '@ts-rest/core';

export type UserAuth = UsersRecord & AuthSystemFields<{}> & { token: string };

const c = initContract();

const authContract = c.router({
    login: {
        method: 'POST',
        path: '/api/v1/auth/login',
        responses: {
            200: c.type<UserAuth>(),
            401: c.type<{ message: string }>(),
        },
        body: z.object({
            username: z.string(),
            password: z.string(),
        }),
        summary: 'Login to the system',
    }
});

const contract = c.router({
    auth: authContract,
});

export default contract;
