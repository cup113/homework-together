import express from 'express';
import type { Express } from 'express';
import { createExpressEndpoints, initServer } from '@ts-rest/express';
import logger from 'morgan';
import bodyParser from 'body-parser';
import compression from 'compression';
import 'express-async-errors';
import ViteExpress from "vite-express";
import { Server } from "socket.io";

import contract from './types/contract.js';
import loggerService from './services/logger.mjs'
import { LoginRoute, RegisterRoute, CheckUserRoute, UpdateUserWorkingRoute, UpdateUserRoute, DeleteUserRoute } from './routes/auth.mjs';
import { CreateItemRoute, GetItemRoute, UpdateItemRoute, DeleteItemsRoute } from './routes/items.mjs'
import { ListSubjectsRoute } from './routes/subjects.mjs';
import { CreateOrganizationRoute, QueryOrganizationRoute, EnterOrganizationRoute, GetProgressRoute } from './routes/organizations.mjs';

import type { SocketServer } from './types/ws.js';
import { initIO } from './services/ws.mjs';

export function startServer(mode?: 'production' | 'development') {
    const app: Express = express();

    app.use(logger('dev'));
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(compression());

    const serverRouter = initServer();
    const router = serverRouter.router(contract, {
        auth: {
            login({ body: { username, password } }) {
                return new LoginRoute(username, password).getResponse();
            },
            register({ body: { username, password } }) {
                return new RegisterRoute(username, password).getResponse();
            },
            check({ headers: { authorization } }) {
                return new CheckUserRoute(authorization).getResponse();
            },
            working({ headers: { authorization }, body: { workingOnItemId } }) {
                return new UpdateUserWorkingRoute(authorization, workingOnItemId).getResponse();
            },
            update({ headers: { authorization }, body }) {
                return new UpdateUserRoute(authorization, body).getResponse();
            },
            delete({ headers: { authorization } }) {
                return new DeleteUserRoute(authorization).getResponse();
            },
        },
        items: {
            list({ headers: { authorization } }) {
                return new GetItemRoute(authorization).getResponse();
            },
            update({ headers: { authorization }, body }) {
                return new UpdateItemRoute(authorization, body).getResponse();
            },
            create({ headers: { authorization }, body: { publicItem, userItem } }) {
                return new CreateItemRoute(authorization, publicItem, userItem).getResponse();
            },
            delete({ headers: { authorization }, body: { ids, type } }) {
                return new DeleteItemsRoute(authorization, ids, type).getResponse();
            }
        },
        subjects: {
            list() {
                return new ListSubjectsRoute().getResponse();
            }
        },
        organizations: {
            register({ headers: { authorization }, body }) {
                return new CreateOrganizationRoute(authorization, body).getResponse();
            },
            query({ query: { name } }) {
                return new QueryOrganizationRoute(name).getResponse();
            },
            join({ headers: { authorization }, body: { organizationId } }) {
                return new EnterOrganizationRoute(authorization, organizationId).getResponse();
            },
            progress({ headers: { authorization }, body: { organizations } }) {
                return new GetProgressRoute(authorization, organizations).getResponse();
            },
        }
    });

    createExpressEndpoints(contract, router, app);


    const isProduction = (mode ?? process.env["NODE_ENV"] ?? "").startsWith("production");
    const port = isProduction ? 8080 : 3000;

    loggerService.info(`Starting server with environment variables:\n${JSON.stringify(process.env, null, 2)}`);
    ViteExpress.config({
        mode: isProduction ? "production" : "development",
    });

    const server = ViteExpress.listen(app, port, () => {
        loggerService.info(`Server is listening at http://localhost:${port}/`);
    });

    const io: SocketServer = new Server(server, {});

    initIO(io);

    return server;
}
