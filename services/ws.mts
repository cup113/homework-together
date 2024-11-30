import type { SocketServer } from '../types/ws.js';
import logger from './logger.mjs';
import { DBService } from './database.mjs';
import dayjs from 'dayjs';
import type { UsersResponse } from '../types/pocketbase-types.js';

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
            let user: UsersResponse;
            try {
                user = (await db.authWithToken(token)).record;
            } catch (e) {
                logger.error(e);
                return;
            }
            socket.on('disconnect', () => {
                io().to(user.organizations).emit('usersLeft', [user.id]);
            })
            socket.data.user = user;
            socket.join(user.organizations);
            io().to(user.organizations).emit('usersJoined', [user.id]);
            io().to(user.organizations).emit('refresh', user.id, ['share']);
            const sockets = await socket.in(user.organizations).fetchSockets();
            logger.info(`User ${user.id} joined ${user.organizations} with ${sockets.length} other users online`);
            const onlineUserIds = sockets.map(socket => socket.data.user?.id).filter(id => id !== undefined).filter(id => id !== user.id);
            socket.emit('usersJoined', onlineUserIds);
        }
    });
}

export function io(): SocketServer {
    if (!_io) {
        throw new Error('Socket.io not initialized');
    }
    return _io;
}

