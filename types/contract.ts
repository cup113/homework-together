import type { UsersRecord, UsersResponse, AuthSystemFields, UserItemsResponse, PublicItemsRecord, SubjectsRecord, UserItemsRecord, OrganizationsRecord, OrganizationsResponse } from './pocketbase-types.js';
import { PublicItemsRangeOptions } from './pocketbase-types.js';
import z from 'zod';
import { initContract } from '@ts-rest/core';

export type UserAuth = UsersRecord & AuthSystemFields<object> & { token: string };
export type UserInfo = Omit<UserAuth, 'organizations'> & { organizations: OrganizationsResponse[] }
export type RawOrganization = Pick<OrganizationsRecord, 'name'>
export type SharedProgress = {
    items: Record<string, Record<string, [number, number]>>,
    subjects: Record<string, Record<string, [number, number]>>,
    overall: Record<string, [number, number]>,
    users: UsersResponse[],
};
export type Subject = SubjectsRecord & Pick<AuthSystemFields, 'id'>;
export type Item = UserItemsResponse & { public: PublicItemsRecord };
export type RawUserItem = Omit<UserItemsRecord, 'user' | 'publicItem' | 'confirmed'>
export type RawPublicItem = Omit<PublicItemsRecord, 'author'>

const ID = z.string().length(15);
const DATE_STR = z.string().max(30);
const GENERAL_STRING = z.string().max(256);
const LONG_STRING = z.string().max(4 * 1024);

const itemsUpdateSchema = z.object({
    publicItem: z.optional(z.object({
        id: ID,
        organization: z.optional(ID),
        deadline: z.optional(DATE_STR),
        description: z.optional(LONG_STRING),
        subject: z.optional(ID),
        estimateMinutes: z.optional(z.number()),
        range: z.optional(z.enum([
            PublicItemsRangeOptions.all,
            PublicItemsRangeOptions.some,
            PublicItemsRangeOptions.private
        ])),
        snaps: z.optional(GENERAL_STRING),
    })),
    userItem: z.optional(z.object({
        id: ID,
        progress: z.optional(z.number()),
        estimateMinutes: z.optional(z.number()),
        note: z.optional(LONG_STRING),
        confirmed: z.optional(z.boolean()),
    })),
});
const itemsCreateSchema = z.object({
    publicItem: z.object({
        organization: z.optional(ID),
        deadline: z.optional(DATE_STR),
        description: LONG_STRING,
        subject: ID,
        estimateMinutes: z.number(),
        range: z.enum([
            PublicItemsRangeOptions.all,
            PublicItemsRangeOptions.some,
            PublicItemsRangeOptions.private
        ]),
        snaps: z.optional(GENERAL_STRING),
    }),
    userItem: z.object({
        progress: z.optional(z.number()),
        estimateMinutes: z.number(),
        note: z.optional(LONG_STRING),
    }),
});

export type ItemsUpdate = z.infer<typeof itemsUpdateSchema>;
export type ItemsCreate = z.infer<typeof itemsCreateSchema>;

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
            username: GENERAL_STRING,
            password: GENERAL_STRING,
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
            username: GENERAL_STRING,
            password: GENERAL_STRING,
        }),
        summary: 'Register a new user',
    },
    check: {
        method: 'PUT',
        path: '/api/v1/auth/check',
        responses: {
            200: c.type<UserInfo>(),
            401: ErrorType,
        },
        body: z.object({}),
        summary: "Check the user's authentication status, refresh the token if necessary, and synchronize the user's organizations",
    },
    working: {
        method: 'PUT',
        path: '/api/v1/auth/working',
        responses: {
            200: c.type<true>(),
            401: ErrorType,
        },
        body: z.object({
            workingOnItemId: z.optional(ID),
        }),
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
    },
    update: {
        method: 'PUT',
        path: '/api/v1/items',
        responses: {
            200: c.type<true>(),
            401: ErrorType,
            403: ErrorType,
            404: ErrorType,
        },
        body: itemsUpdateSchema,
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
        body: itemsCreateSchema,
        summary: "Create a new item",
    },
    delete: {
        method: 'DELETE',
        path: '/api/v1/items',
        responses: {
            200: c.type<true>(),
            401: ErrorType,
            403: ErrorType,
            404: ErrorType,
        },
        body: z.object({
            type: z.enum(['public', 'user']),
            ids: z.array(ID),
        }),
        summary: "Delete an item",
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
    register: {
        method: 'POST',
        path: '/api/v1/organizations',
        body: z.object({
            name: GENERAL_STRING,
        }),
        responses: {
            200: c.type<OrganizationsResponse>(),
            400: ErrorType,
            401: ErrorType,
        },
    },
    query: {
        method: 'GET',
        path: '/api/v1/organizations',
        query: z.object({
            name: GENERAL_STRING
        }),
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
            organizationId: ID,
        }),
        summary: "Enter an organization",
    },
    progress: {
        method: 'GET',
        path: '/api/v1/organizations/progress',
        responses: {
            200: c.type<SharedProgress>(),
            401: ErrorType,
            404: ErrorType,
        },
        summary: "Get the progress of the user's organizations",
    }
});

const contract = c.router({
    auth: authContract,
    items: itemsContract,
    subjects: subjectsContract,
    organizations: organizationsContract,
});

export default contract;
