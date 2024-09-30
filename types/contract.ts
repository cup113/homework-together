import type { UsersRecord, AuthSystemFields, UserItemsResponse, PublicItemsRecord, SubjectsRecord } from './pocketbase-types.js';
import z from 'zod';
import { initContract } from '@ts-rest/core';

export type UserAuth = UsersRecord & AuthSystemFields<{}> & { token: string };
export type Item = UserItemsResponse & { public: Omit<PublicItemsRecord, 'subject'> & { subject: SubjectsRecord } };

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

const itemsContract = c.router({
    list: {
        method: 'GET',
        path: '/api/v1/items/',
        responses: {
            200: c.type<Item[]>(),
            401: c.type<{ message: string }>(),
        },
    } // TODO: add pagination
});

const contract = c.router({
    auth: authContract,
    items: itemsContract,
});

export default contract;
