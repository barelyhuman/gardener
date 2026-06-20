import { type FlueContext } from '@flue/runtime';
import * as v from 'valibot';
import gardener from '../agents/gardener';

/**
 * Gardener workflow entry point.
 *
 * Spins up the Gardener agent, invokes the `garden` skill with the
 * requested focus area, and validates the structured result.
 */
export async function run({ init, payload }: FlueContext<{ focus?: string }>) {
	const harness = await init(gardener);
	const session = await harness.session();

	const { data } = await session.skill('garden', {
		args: { focus: payload.focus ?? 'general maintenance' },
		result: v.object({
			summary: v.string(),
			findings: v.array(
				v.object({
					area: v.string(),
					severity: v.picklist(['low', 'medium', 'high']),
					suggestion: v.string(),
				}),
			),
			actions_taken: v.array(v.string()),
		}),
	});

	return data;
}
