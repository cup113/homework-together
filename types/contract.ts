import type { UsersRecord, AuthSystemFields, UserItemsResponse, PublicItemsRecord, SubjectsRecord } from './pocketbase-types.js';
import z from 'zod';
import { initContract } from '@ts-rest/core';

export type UserAuth = UsersRecord & AuthSystemFields<object> & { token: string };
export type Item = UserItemsResponse & { public: Omit<PublicItemsRecord, 'subject'> & { subject: SubjectsRecord } };

const c = initContract();

const ErrorType = c.type<{ message: string }>();

const authContract = c.router({
    login: {
        method: 'POST',
        path: '/api/v1/auth/login',
        responses: {
            200: c.type<UserAuth>(),
            401: ErrorType,
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
        path: '/api/v1/items',
        responses: {
            200: c.type<Item[]>(),
            401: ErrorType,
        },
        summary: "List all items",
    }, // TODO: add pagination
    update: {
        method: 'PUT',
        path: '/api/v1/items',
        responses: {
            200: c.type<true>(),
            401: ErrorType,
            403: ErrorType,
            404: ErrorType,
        },
        body: z.object({
            id: z.string(),
            progress: z.number(),
        }),
        summary: "Update an item",
    },
});

const subjectsContract = c.router({
    list: {
        method: 'GET',
        path: '/api/v1/subjects',
        responses: {
            200: c.type<SubjectsRecord[]>(),
        },
    },
})

const contract = c.router({
    auth: authContract,
    items: itemsContract,
    subjects: subjectsContract,
});

export default contract;
