/**
* This file was @generated using pocketbase-typegen
*/

import type PocketBase from 'pocketbase'
import type { RecordService } from 'pocketbase'

export enum Collections {
	Organizations = "organizations",
	PublicItems = "publicItems",
	Subjects = "subjects",
	UserItems = "userItems",
	Users = "users",
}

// Alias types for improved usability
export type IsoDateString = string
export type RecordIdString = string
export type HTMLString = string

// System fields
export type BaseSystemFields<T = never> = {
	id: RecordIdString
	created: IsoDateString
	updated: IsoDateString
	collectionId: string
	collectionName: Collections
	expand?: T
}

export type AuthSystemFields<T = never> = {
	email: string
	emailVisibility: boolean
	username: string
	verified: boolean
} & BaseSystemFields<T>

// Record types for each collection

export type OrganizationsRecord = {
	items?: RecordIdString
	leader: RecordIdString
	managers?: RecordIdString[]
	name: string
}

export enum PublicItemsRangeOptions {
	"all" = "all",
	"some" = "some",
	"private" = "private",
}
export type PublicItemsRecord = {
	author: RecordIdString
	deadline?: IsoDateString
	description: HTMLString
	estimateMinutes: number
	organization?: RecordIdString
	range: PublicItemsRangeOptions
	subject: RecordIdString
}

export type SubjectsRecord = {
	abbr: string
	name: string
}

export type UserItemsRecord = {
	estimateMinutes: number
	note?: HTMLString
	progress?: number
	publicItem: RecordIdString
	user: RecordIdString
}

export type UsersRecord = {
	avatar?: string
	goal?: IsoDateString
	name?: string
	organizations?: RecordIdString[]
}

// Response types include system fields and match responses from the PocketBase API
export type OrganizationsResponse<Texpand = unknown> = Required<OrganizationsRecord> & BaseSystemFields<Texpand>
export type PublicItemsResponse<Texpand = unknown> = Required<PublicItemsRecord> & BaseSystemFields<Texpand>
export type SubjectsResponse<Texpand = unknown> = Required<SubjectsRecord> & BaseSystemFields<Texpand>
export type UserItemsResponse<Texpand = unknown> = Required<UserItemsRecord> & BaseSystemFields<Texpand>
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	organizations: OrganizationsRecord
	publicItems: PublicItemsRecord
	subjects: SubjectsRecord
	userItems: UserItemsRecord
	users: UsersRecord
}

export type CollectionResponses = {
	organizations: OrganizationsResponse
	publicItems: PublicItemsResponse
	subjects: SubjectsResponse
	userItems: UserItemsResponse
	users: UsersResponse
}

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = PocketBase & {
	collection(idOrName: 'organizations'): RecordService<OrganizationsResponse>
	collection(idOrName: 'publicItems'): RecordService<PublicItemsResponse>
	collection(idOrName: 'subjects'): RecordService<SubjectsResponse>
	collection(idOrName: 'userItems'): RecordService<UserItemsResponse>
	collection(idOrName: 'users'): RecordService<UsersResponse>
}
