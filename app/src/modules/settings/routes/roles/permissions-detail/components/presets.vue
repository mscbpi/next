<template>
	<div>
		<v-modal-heading
			:heading="
				$t('presets_for_role', {
					action: $t(permission.action).toLowerCase(),
					role: role ? role.name : $t('public'),
				})
			"
		/>
		<interface-code v-model="presets" language="json" type="json" />
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { Permission, Role } from '@/types';
import useSync from '@/composables/use-sync';

export default defineComponent({
	props: {
		permission: {
			type: Object as PropType<Permission>,
			default: null,
		},
		role: {
			type: Object as PropType<Role>,
			required: true,
		},
	},
	setup(props, { emit }) {
		const _permission = useSync(props, 'permission', emit);

		const presets = computed({
			get() {
				return _permission.value.presets;
			},
			set(newPresets: Record<string, any> | null) {
				_permission.value = {
					..._permission.value,
					presets: newPresets,
				};
			},
		});

		return { presets };
	},
});
</script>
