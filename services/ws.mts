import type { SocketServer } from '../types/ws.js';
import logger from './logger.mjs';
import { DBService } from './database.mjs';
import dayjs from 'dayjs';

export let _io: SocketServer | null = null;
let visits = 0;
const buildVersion = dayjs().format('YYYYMMDD-HHmmss');

export function initIO(server: SocketServer) {
    _io = server;
    _io.on('connection', async (socket) => {
        visits++;
        logger.info(`Socket visits: ${visits}`);
        socket.emit('info', buildVersion);
        const authorization = socket.handshake.headers.authorization;
        if (!authorization || !authorization.startsWith('Bearer ')) {
            socket.disconnect(true);
            return;
        }
        const token = authorization.slice("Bearer ".length);
        if (token) {
            const db = new DBService();
            const user = (await db.authWithToken(token)).record;
            socket.data.user = user;
            socket.join(user.organizations);
        }
    });
}

export function io(): SocketServer {
    if (!_io) {
        throw new Error('Socket.io not initialized');
    }
    return _io;
}

