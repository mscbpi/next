<template>
	<private-view :title="loading ? $t('loading') : $t('editing_role', { role: item && item.name })">
		<template #headline>{{ $t('settings_permissions') }}</template>
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon exact :to="`/settings/roles/`">
				<v-icon name="arrow_back" />
			</v-button>
		</template>
		<template #actions>
			<v-dialog v-model="confirmDelete" v-if="[1, 2].includes(+primaryKey) === false">
				<template #activator="{ on }">
					<v-button
						rounded
						icon
						class="action-delete"
						:disabled="item === null"
						@click="on"
						v-tooltip.bottom="$t('delete')"
					>
						<v-icon name="delete" outline />
					</v-button>
				</template>

				<v-card>
					<v-card-title>{{ $t('delete_are_you_sure') }}</v-card-title>

					<v-card-actions>
						<v-button @click="confirmDelete = false" secondary>
							{{ $t('cancel') }}
						</v-button>
						<v-button @click="deleteAndQuit" class="action-delete" :loading="deleting">
							{{ $t('delete') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-button
				rounded
				icon
				:loading="saving"
				:disabled="hasEdits === false"
				@click="saveAndQuit"
				v-tooltip.bottom="$t('save')"
			>
				<v-icon name="check" />
			</v-button>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<div class="roles">
			<v-notice v-if="adminEnabled" type="info">
				{{ $t('admins_have_all_permissions') }}
			</v-notice>
			<permissions-overview v-else :role="primaryKey" :permission="permissionKey" />

			<v-form
				collection="directus_roles"
				:primary-key="primaryKey"
				:loading="loading"
				:initial-values="item"
				:batch-mode="isBatch"
				v-model="edits"
			/>
		</div>

		<template #drawer>
			<role-info-drawer-detail :role="item" />
			<revisions-drawer-detail collection="directus_roles" :primary-key="primaryKey" />
		</template>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed, toRefs, ref } from '@vue/composition-api';

import SettingsNavigation from '../../../components/navigation.vue';
import router from '@/router';
import RevisionsDrawerDetail from '@/views/private/components/revisions-drawer-detail';
import useItem from '@/composables/use-item';
import { useUserStore } from '@/stores/';
import RoleInfoDrawerDetail from './components/role-info-drawer-detail.vue';
import PermissionsOverview from './components/permissions-overview.vue';

type Values = {
	[field: string]: any;
};

export default defineComponent({
	name: 'roles-detail',
	components: { SettingsNavigation, RevisionsDrawerDetail, RoleInfoDrawerDetail, PermissionsOverview },
	props: {
		primaryKey: {
			type: String,
			required: true,
		},
		permissionKey: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const userStore = useUserStore();

		const { primaryKey } = toRefs(props);

		const { edits, item, saving, loading, error, save, remove, deleting, isBatch } = useItem(
			ref('directus_roles'),
			primaryKey
		);

		const hasEdits = computed<boolean>(() => Object.keys(edits.value).length > 0);

		const confirmDelete = ref(false);

		const adminEnabled = computed(() => {
			const values = {
				...item.value,
				...edits.value,
			};

			return !!values.admin_access;
		});

		return {
			item,
			loading,
			error,
			edits,
			hasEdits,
			saving,
			saveAndQuit,
			deleteAndQuit,
			confirmDelete,
			deleting,
			isBatch,
			adminEnabled,
		};

		/**
		 * @NOTE
		 * The userStore contains the information about the role of the current user. We want to
		 * update the userstore to make sure the role information is accurate with the latest changes
		 * in case we're changing the current user's role
		 */

		async function saveAndQuit() {
			await save();
			await userStore.hydrate();
			router.push(`/settings/roles`);
		}

		async function deleteAndQuit() {
			await remove();
			router.push(`/settings/roles`);
		}
	},
});
</script>

<style lang="scss" scoped>
.action-delete {
	--v-button-background-color: var(--danger-25);
	--v-button-color: var(--danger);
	--v-button-background-color-hover: var(--danger-50);
	--v-button-color-hover: var(--danger);
}

.roles {
	padding: var(--content-padding);
	padding-bottom: var(--content-padding-bottom);
}

.v-notice,
.v-skeleton-loader {
	max-width: 800px;
}

.header-icon {
	--v-button-background-color: var(--warning-25);
	--v-button-color: var(--warning);
	--v-button-background-color-hover: var(--warning-50);
	--v-button-color-hover: var(--warning);
}

.permissions-overview,
.roles .v-notice {
	margin-bottom: 48px;
}
</style>
