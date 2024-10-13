import type { Server } from "socket.io";
import type { Socket } from 'socket.io-client';
import type { UsersResponse } from "./pocketbase-types.js";
import type { ItemsCreate, ItemsUpdate, Item } from "./contract.js";

export interface ProgressChange {
    itemId: string;
    subjectId: string;
    userId: string;
    newProgress: [number, number];
}

export interface ServerToClientEvents {
    info(version: string): void;
    refresh(except: string, sources: ('items' | 'share')[]): void;
    progressUpdated(data: ProgressChange): void;
    userJoined(user: UsersResponse): void;
    itemsDeleted(ids: string[]): void;
    itemCreated(item: Item): void;
}

export type ClientToServerEvents = {
    updateItem(item: ItemsUpdate, callback: (error?: string) => void): void;
    createItem(item: ItemsCreate): void;
    deleteItems(ids: string[], type: "user" | "public"): void;

    received(): void;
}

export type InterServerEvents = object;

export type SocketData = {
    user?: UsersResponse;
};

export type SocketServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export type SocketClient = Socket<ServerToClientEvents, ClientToServerEvents>;
