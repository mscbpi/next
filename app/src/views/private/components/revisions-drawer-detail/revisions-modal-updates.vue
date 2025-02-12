<template>
	<div class="updates">
		<v-modal-heading :heading="$t('changes_made')" :subheading="$t('no_relational_data')" />

		<div class="change" v-for="change in changes" :key="change.name">
			<div class="type-label">{{ change.name }}</div>
			<revisions-modal-updates-change deleted :changes="change.changes" />
			<revisions-modal-updates-change added :changes="change.changes" />
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { Revision } from './types';
import { useFieldsStore } from '@/stores';
import { diffWordsWithSpace, diffJson, diffArrays } from 'diff';
import RevisionsModalUpdatesChange from './revisions-modal-updates-change.vue';

export default defineComponent({
	components: { RevisionsModalUpdatesChange },
	props: {
		revision: {
			type: Object as PropType<Revision>,
			required: true,
		},
		revisions: {
			type: Array as PropType<Revision[]>,
			required: true,
		},
	},
	setup(props) {
		const fieldsStore = useFieldsStore();

		const previousRevision = computed(() => {
			const currentIndex = props.revisions.findIndex((revision) => revision.id === props.revision.id);

			// This is assuming props.revisions is in chronological order from newest to oldest
			return props.revisions[currentIndex + 1];
		});

		const changes = computed(() => {
			if (!previousRevision.value) return null;

			const changedFields = Object.keys(props.revision.delta);

			return changedFields.map((fieldKey) => {
				const name = fieldsStore.getField(props.revision.collection, fieldKey).name;
				const currentValue = props.revision.delta[fieldKey];
				const previousValue = previousRevision.value.data[fieldKey];

				let changes;

				if (typeof currentValue === 'string' && currentValue.length > 25) {
					changes = diffWordsWithSpace(previousValue, currentValue);
				} else if (Array.isArray(currentValue)) {
					changes = diffArrays(previousValue, currentValue);
				} else if (typeof currentValue === 'object') {
					changes = diffJson(previousValue, currentValue);
				} else {
					// This is considering the whole thing a change
					changes = [
						{
							removed: true,
							value: previousValue,
						},
						{
							added: true,
							value: currentValue,
						},
					];
				}

				return { name, changes };
			});
		});

		return { changes, previousRevision };
	},
});
</script>

<style lang="scss" scoped>
.change {
	margin-bottom: 24px;
}

.type-label {
	margin-bottom: 8px;
}

.change-line {
	margin-bottom: 4px;
}
</style>
