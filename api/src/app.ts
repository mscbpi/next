import express from 'express';
import bodyParser from 'body-parser';
import logger from './logger';
import expressLogger from 'express-pino-logger';
import path from 'path';

import { validateEnv } from './utils/validate-env';
import env from './env';
import { track } from './utils/track';

import errorHandler from './middleware/error-handler';
import cors from './middleware/cors';
import rateLimiter from './middleware/rate-limiter';
import cache from './middleware/cache';
import extractToken from './middleware/extract-token';
import authenticate from './middleware/authenticate';
import responseHook from './middleware/response-hook';
import activityRouter from './controllers/activity';
import assetsRouter from './controllers/assets';
import authRouter from './controllers/auth';
import collectionsRouter from './controllers/collections';
import extensionsRouter from './controllers/extensions';
import fieldsRouter from './controllers/fields';
import filesRouter from './controllers/files';
import foldersRouter from './controllers/folders';
import itemsRouter from './controllers/items';
import permissionsRouter from './controllers/permissions';
import presetsRouter from './controllers/presets';
import relationsRouter from './controllers/relations';
import revisionsRouter from './controllers/revisions';
import rolesRouter from './controllers/roles';
import serverRouter from './controllers/server';
import settingsRouter from './controllers/settings';
import usersRouter from './controllers/users';
import utilsRouter from './controllers/utils';
import webhooksRouter from './controllers/webhooks';
import graphqlRouter from './controllers/graphql';

import notFoundHandler from './controllers/not-found';
import sanitizeQuery from './middleware/sanitize-query';
import { WebhooksService } from './services/webhooks';
import { InvalidPayloadException } from './exceptions';

import { registerExtensions } from './extensions';
import emitter from './emitter';

validateEnv(['KEY', 'SECRET']);

const app = express();

const customRouter = express.Router();

app.disable('x-powered-by');
app.set('trust proxy', true);

app.use(expressLogger({ logger }));
app.use(responseHook);

app.use((req, res, next) => {
	bodyParser.json()(req, res, (err) => {
		if (err) {
			return next(new InvalidPayloadException(err.message));
		}

		return next();
	});
});

app.use(bodyParser.json());
app.use(extractToken);

app.use((req, res, next) => {
	res.setHeader('X-Powered-By', 'Directus');
	next();
});

if (env.CORS_ENABLED === true) {
	app.use(cors);
}

if (env.NODE_ENV !== 'development') {
	const adminPath = require.resolve('@directus/app/dist/index.html');

	app.get('/', (req, res) => res.redirect('/admin/'));
	app.use('/admin', express.static(path.join(adminPath, '..')));
	app.use('/admin/*', (req, res) => {
		res.sendFile(adminPath);
	});
}

// use the rate limiter - all routes for now
if (env.RATE_LIMITER_ENABLED === true) {
	app.use(rateLimiter);
}

app.use(sanitizeQuery);

app.use('/auth', authRouter);

app.use(authenticate);
app.use(cache);

app.use('/graphql', graphqlRouter);

app.use('/activity', activityRouter);
app.use('/assets', assetsRouter);
app.use('/collections', collectionsRouter);
app.use('/extensions', extensionsRouter);
app.use('/fields', fieldsRouter);
app.use('/files', filesRouter);
app.use('/folders', foldersRouter);
app.use('/items', itemsRouter);
app.use('/permissions', permissionsRouter);
app.use('/presets', presetsRouter);
app.use('/relations', relationsRouter);
app.use('/revisions', revisionsRouter);
app.use('/roles', rolesRouter);
app.use('/server/', serverRouter);
app.use('/settings', settingsRouter);
app.use('/users', usersRouter);
app.use('/utils', utilsRouter);
app.use('/webhooks', webhooksRouter);
app.use('/custom', customRouter);
app.use(notFoundHandler);
app.use(errorHandler);

// Register all webhooks
const webhooksService = new WebhooksService();
webhooksService.register();

// Register custom hooks / endpoints
registerExtensions(customRouter);

track('serverStarted');

emitter.emitAsync('server.started').catch((err) => logger.warn(err));

export default app;
