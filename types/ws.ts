import type { Server } from "socket.io";
import type { Socket } from 'socket.io-client';
import type { UsersResponse } from "./pocketbase-types.js";

export interface ProgressChange {
    itemId: string;
    subjectId: string;
    userId: string;
    organizationId: string;
    newProgress: [number, number];
}

export interface ServerToClientEvents {
    info(version: string): void;
    usersJoined(userIds: string[]): void;
    usersLeft(userIds: string[]): void;
    refresh(except: string, sources: ('items' | 'share')[]): void;
    progressUpdated(data: ProgressChange): void;
    userUpdated(user: Partial<UsersResponse> & Pick<UsersResponse, 'id'>): void;
}

export type ClientToServerEvents = object;

export type InterServerEvents = object;

export type SocketData = {
    user?: UsersResponse;
};

export type SocketServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export type SocketClient = Socket<ServerToClientEvents, ClientToServerEvents>;
