import fse from 'fs-extra';
import Knex from 'knex';
import path from 'path';
import formatTitle from '@directus/format-title';

type Migration = {
	version: string;
	name: string;
	timestamp: Date;
};

export default async function run(database: Knex, direction: 'up' | 'down' | 'latest') {
	let migrationFiles = await fse.readdir(__dirname);
	migrationFiles = migrationFiles.filter((file: string) => file !== 'run.ts');

	const completedMigrations = await database
		.select<Migration[]>('*')
		.from('directus_migrations')
		.orderBy('version');

	const migrations = migrationFiles.map((migrationFile) => {
		const version = migrationFile.split('-')[0];
		const name = formatTitle(migrationFile.split('-').slice(1).join('_').split('.')[0]);
		const completed = !!completedMigrations.find((migration) => migration.version === version);

		return {
			file: migrationFile,
			version,
			name,
			completed,
		};
	});

	if (direction === 'up') await up();
	if (direction === 'down') await down();
	if (direction === 'latest') await latest();

	async function up() {
		const currentVersion = completedMigrations[completedMigrations.length - 1];

		let nextVersion: any;

		if (!currentVersion) {
			nextVersion = migrations[0];
		} else {
			nextVersion = migrations.find((migration) => {
				return migration.version > currentVersion.version && migration.completed === false;
			});
		}

		if (!nextVersion) {
			throw Error('Nothing to upgrade');
		}

		const { up } = require(path.join(__dirname, nextVersion.file));
		await up(database);
		await database
			.insert({ version: nextVersion.version, name: nextVersion.name })
			.into('directus_migrations');
	}

	async function down() {
		const currentVersion = completedMigrations[completedMigrations.length - 1];

		if (!currentVersion) {
			throw Error('Nothing to downgrade');
		}

		const migration = migrations.find(
			(migration) => migration.version === currentVersion.version
		);

		if (!migration) {
			throw new Error('Couldnt find migration');
		}

		const { down } = require(path.join(__dirname, migration.file));
		await down(database);
		await database('directus_migrations').delete().where({ version: migration.version });
	}

	async function latest() {
		for (const migration of migrations) {
			if (migration.completed === false) {
				const { up } = require(path.join(__dirname, migration.file));
				await up(database);
				await database
					.insert({ version: migration.version, name: migration.name })
					.into('directus_migrations');
			}
		}
	}
}
