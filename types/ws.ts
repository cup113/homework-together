import type { Server } from "socket.io";
import type { Socket } from 'socket.io-client';
import { UsersResponse } from "./pocketbase-types.js";

export interface ProgressChange {
    itemId: string;
    subjectId: string;
    userId: string;
    newProgress: [number, number];
}

export interface ServerToClientEvents {
    // itemAdded(item: Item): void;
    // itemUpdated(item: ItemsUpdate): void;
    // itemsDeleted(ids: string[]): void;
    refresh(except: string): void;
    progressUpdated(data: ProgressChange): void;
    // userJoined(user: UsersResponse): void;

    // itemAddFailed(failed: Failed<ItemsCreate>): void;
    // itemUpdateFailed(failed: Failed<ItemsUpdate>): void;
    // itemsDeleteFailed(failed: Failed<string[]>): void;
}

export type ClientToServerEvents = object;
// updateItem(item: ItemsUpdate): void;
// createItem(item: ItemsCreate): void;
// deleteItems(ids: string[], type: "user" | "public"): void;

export type InterServerEvents = object;

export type SocketData = {
    user?: UsersResponse;
};

export type SocketServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export type SocketClient = Socket<ServerToClientEvents, ClientToServerEvents>;
