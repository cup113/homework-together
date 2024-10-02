import express from 'express';
import type { Express } from 'express';
import { createExpressEndpoints, initServer } from '@ts-rest/express';
import logger from 'morgan';
import bodyParser from 'body-parser';
import compression from 'compression';
import 'express-async-errors';
import ViteExpress from "vite-express";

import contract from './types/contract.js';
import loggerService from './services/logger.mjs'
import { LoginRoute, RegisterRoute } from './routes/auth.mjs';
import { CreateItemRoute, GetItemRoute, UpdateUserItemRoute } from './routes/items.mjs'
import { ListSubjectsRoute } from './routes/subjects.mjs';
import { ListOrganizationsRoute, EnterOrganizationRoute } from './routes/organizations.mjs'

const app: Express = express();

app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(compression());

const server = initServer();
const router = server.router(contract, {
    auth: {
        login({ body: { username, password } }) {
            return new LoginRoute(username, password).getResponse();
        },
        register({ body: { username, password } }) {
            return new RegisterRoute(username, password).getResponse();
        }
    },
    items: {
        list({ headers: { authorization } }) {
            return new GetItemRoute(authorization).getResponse();
        },
        update({ headers: { authorization }, body: { id, progress } }) {
            return new UpdateUserItemRoute(authorization, id, { progress }).getResponse();
        },
        create({ headers: { authorization }, body: { publicItem, userItem } }) {
            return new CreateItemRoute(authorization, publicItem, userItem).getResponse();
        }
    },
    subjects: {
        list() {
            return new ListSubjectsRoute().getResponse();
        }
    },
    organizations: {
        list() {
            return new ListOrganizationsRoute().getResponse();
        },
        join({ headers: { authorization }, body: { organizationId } }) {
            return new EnterOrganizationRoute(authorization, organizationId).getResponse();
        }
    }
});

createExpressEndpoints(contract, router, app);

const isProduction = process.env["NODE_ENV"]?.startsWith("production") ? true : false;

loggerService.info(`Starting server with environment variables:\n${JSON.stringify(process.env, null, 2)}`);
ViteExpress.config({
    mode: isProduction ? "production" : "development",
})
ViteExpress.listen(app, isProduction? 8080 : 3000, () => loggerService.info("Server is listening..."));

