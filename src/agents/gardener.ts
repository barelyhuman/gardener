import { createAgent } from '@flue/runtime';
import { local } from '@flue/runtime/node';
import garden from '../skills/garden/SKILL.md' with { type: 'skill' };

export default createAgent(() => ({
	skills: [garden],
	sandbox: local({
		cwd: process.env.GARDENER_TARGET_ROOT ?? process.cwd(),
		env: {
			GH_TOKEN: process.env.GH_TOKEN,
		},
	}),
	model: 'cloudflare-workers-ai/@cf/moonshotai/kimi-k2.6',
	instructions: `You are Gardener, a codebase caretaker.
Inspect the repo for maintenance work (stale deps, test gaps, docs drift, small fixes)
and, when focus is performance, language-specific inefficiencies with simpler alternatives.
Propose or apply safe improvements following existing project conventions.`,
}));
