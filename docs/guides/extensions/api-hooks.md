# Creating a Custom API Hook

> Hooks allow running custom logic when specificed events occur within your project.

## 1. Create a Hook File

Custom hooks are dynamically loaded from within your extensions folder. By default this directory is located at `/extensions`, but it can be configured within your project's env file to be located anywhere. Hooks can be added [standalone](#) or via an [extension bundle](#).

### Default Standalone Hook Location
```
/extensions/hooks/<hook-id>/index.js
```

### Default Bundled Hook Location
```
/extensions/bundles/<bundle-id>/hooks/<hook-id>/index.js
```

## 2. Define the Event

Next, you will want to define your event. You can trigger your custom hook with any of the platform's many API events. System events are referenced with the format:

```
<scope>.<action>(.<before>)
// eg: items.create
// eg: files.create
// eg: server.start
// eg: collections.*
// eg: users.update.before
```

### Scope

The scope determines the API endpoint that is triggered. The `*` wildcard can also be used to include all scopes.

::: System Scope
Currently all system tables are available as event scopes except for `directus_migrations` and `directus_sessions`, which don't have relevant endpoints or services.
:::

### Action

Defines the triggering operation within the specified context (see chart below). The `*` wildcard can also be used to include all actions available to the scope.

### Before

Many scopes (see chart below) support an optional `.before` suffix for running a _blocking_ hook prior to the event being fired. This allows you to check and/or modify the event's payload before it is processed.

* `items.create` (Non Blocking)
* `items.create.before` (Blocking)

### Event Format Options

| Scope         | Actions                            | Before   |
|---------------|------------------------------------|----------|
| `items`       | `create`, `update` and `delete`    | Optional |
| `activity`    | `create`, `update` and `delete`    | Optional |
| `collections` | `create`, `update` and `delete`    | Optional |
| `fields`      | `create`, `update` and `delete`    | Optional |
| `files`       | `create`, `update` and `delete`    | Optional |
| `folders`     | `create`, `update` and `delete`    | Optional |
| `permissions` | `create`, `update` and `delete`    | Optional |
| `presets`     | `create`, `update` and `delete`    | Optional |
| `relations`   | `create`, `update` and `delete`    | Optional |
| `revisions`   | `create`, `update` and `delete`    | Optional |
| `roles`       | `create`, `update` and `delete`    | Optional |
| `settings`    | `create`, `update` and `delete`    | Optional |
| `users`       | `create`, `update` and `delete`    | Optional |
| `webhooks`    | `create`, `update` and `delete`    | Optional |
| `server`      | `start` and `error`†               | No       |
| `response`    |                                    | No†      |
| `auth`        | `success`†, `fail`† and `refresh`† | No       |

† TBD

## 3. Register your Hook

Each custom hook is registered to its event scope using a function with the following format:

```js
module.exports = function registerHook() {
	return {
		'items.create': function() {
			axios.post('http://example.com/webhook');
		}
	}
}
```

## 4. Develop your Custom Hook

### Register Function

The register function (eg: `module.exports = function registerHook()`) must return an object where the key is the event, and the value is the handler function itself.

The `registerHook` function receives a context parameter with the following properties:

* `services` — All API interal services
* `exceptions` — API exception objects that can be used for throwing "proper" errors
* `database` — Knex instance that is connected to the current database
* `env` — Parsed environment variables

### Event Handler Function

The event handler function (eg: `'items.create': function()`) recieves a context parameter with the following properties:

* `event` — Full event string
* `accountability` — Information about the current user
* `collection` — Collection that is being modified
* `item` — Primary key(s) of the item(s) being modified
* `action` — Action that is performed
* `payload` — Payload of the request

## 5. Restart the API

To deploy your hook, simply restart the API by running:

```bash
npx directus start
```

---

## Full Example:

```js
// extensions/hooks/sync-with-external/index.js

module.exports = function registerHook({ services, exceptions }) {
	const { ServiceUnavailableException, ForbiddenException } = exceptions;

	return {
		// Force everything to be admin-only at all times
		'items.*.*': async function({ item, accountability }) {
			if (accountability.admin !== true) throw new ForbiddenException();
		},
		// Sync with external recipes service, cancel creation on failure
		'items.create.before': async function(input, { collection }) {
			if (collection !== 'recipes') return input;

			try {
				await axios.post('https://example.com/recipes', input);
			} catch (error) {
				throw new ServiceUnavailableException(error);
			}

			input[0].syncedWithExample = true;

			return input;
		}
	}
}
```
