<template>
	<user-popover v-if="value" :user="value.id">
		<div class="user" :class="display">
			<img
				v-if="(display === 'avatar' || display === 'both') && src"
				:src="src"
				role="presentation"
				:alt="value && `${value.first_name} ${value.last_name}`"
				:class="{ circle }"
			/>
			<img
				v-else-if="(display === 'avatar' || display === 'both') && src === null"
				src="../../assets/avatar-placeholder.svg"
				role="presentation"
				:alt="value && `${value.first_name} ${value.last_name}`"
				:class="{ circle }"
			/>
			<span v-if="display === 'name' || display === 'both'">{{ value.first_name }} {{ value.last_name }}</span>
		</div>
	</user-popover>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { getRootPath } from '@/utils/get-root-path';

type User = {
	id: number;
	avatar: {
		id: string;
	};
	first_name: string;
	last_name: string;
};

export default defineComponent({
	props: {
		value: {
			type: Object as PropType<User>,
			default: null,
		},
		display: {
			type: String as PropType<'avatar' | 'name' | 'both'>,
			default: 'both',
		},
		circle: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const src = computed(() => {
			if (props.value === null) return null;

			if (props.value.avatar?.id) {
				return `${getRootPath()}assets/${props.value.avatar.id}?key=system-small-cover`;
			}
			return null
		});

		return { src };
	},
});
</script>

<style lang="scss" scoped>
.user {
	display: flex;
	align-items: center;
	height: 100%;

	img {
		display: inline-block;
		width: auto;
		height: 100%;
		vertical-align: -30%;
		border-radius: 4px;

		&.circle {
			border-radius: 100%;
		}
	}

	&.both {
		img {
			margin-right: 8px;
		}
	}
}
</style>
