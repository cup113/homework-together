import type { UsersRecord, AuthSystemFields, UserItemsResponse, PublicItemsRecord, SubjectsRecord, UserItemsRecord, OrganizationsRecord, OrganizationsResponse } from './pocketbase-types.js';
import { PublicItemsRangeOptions } from './pocketbase-types.js';
import z from 'zod';
import { initContract } from '@ts-rest/core';

export type UserAuth = UsersRecord & AuthSystemFields<object> & { token: string };
export type RawOrganization = Omit<OrganizationsRecord, 'leader' | 'managers'>
export type SharedProgress = {
    items: Record<string, Record<string, [number, number]>>,
    subjects: Record<string, Record<string, [number, number]>>,
    overall: Record<string, [number, number]>,
};
export type Subject = SubjectsRecord & Pick<AuthSystemFields, 'id'>;
export type Item = UserItemsResponse & { public: Omit<PublicItemsRecord, 'subject'> & { subject: Subject } };
export type RawUserItem = Omit<UserItemsRecord, 'user' | 'publicItem'>
export type RawPublicItem = Omit<PublicItemsRecord, 'author'>

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
    },
    register: {
        method: 'POST',
        path: '/api/v1/auth/register',
        responses: {
            200: c.type<UserAuth>(),
            400: ErrorType,
        },
        body: z.object({
            username: z.string(),
            password: z.string(),
        }),
        summary: 'Register a new user',
    },
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
    create: {
        method: 'POST',
        path: '/api/v1/items',
        responses: {
            200: c.type<Item>(),
            401: ErrorType,
            403: ErrorType,
            404: ErrorType,
        },
        body: z.object({
            publicItem: z.object({
                deadline: z.optional(z.string()),
                description: z.string(),
                subject: z.string(),
                estimateMinutes: z.number(),
                range: z.enum([
                    PublicItemsRangeOptions.all,
                    PublicItemsRangeOptions.some,
                    PublicItemsRangeOptions.private
                ]),
            }),
            userItem: z.object({
                progress: z.optional(z.number()),
                estimateMinutes: z.number(),
                note: z.optional(z.string()),
            }),
        }),
        summary: "Create a new item",
    },
});

const subjectsContract = c.router({
    list: {
        method: 'GET',
        path: '/api/v1/subjects',
        responses: {
            200: c.type<Subject[]>(),
        },
    },
})

const organizationsContract = c.router({
    list: {
        method: 'GET',
        path: '/api/v1/organizations',
        responses: {
            200: c.type<OrganizationsResponse[]>(),
        },
    },
    join: {
        method: 'POST',
        path: '/api/v1/organizations/join',
        responses: {
            200: c.type<OrganizationsResponse>(),
            401: ErrorType,
            403: ErrorType,
            404: ErrorType,
        },
        body: z.object({
            organizationId: z.string(),
        }),
        summary: "Enter an organization",
    },
});

const contract = c.router({
    auth: authContract,
    items: itemsContract,
    subjects: subjectsContract,
    organizations: organizationsContract,
});

export default contract;
