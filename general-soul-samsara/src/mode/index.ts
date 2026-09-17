import { ui, _status } from "noname";
import { randomSeed } from "../shared/rng";
import { SEED_KEY } from "../shared/constants";
import { mountMetaUI } from "../meta/app";
import { runFlow, type DebugHandle } from "../run/flow";
import { createRunState } from "../run/state";
import { loadRun } from "../run/save";
import { injectStyles } from "../battle/engine/ui";
import { installDebugPanel } from "../debug/panel";
import type { BattleRuntime } from "../battle/engine/setup";
import { rogue_kuangbao, rogue_tiejia } from "./skills";
import { TREASURE_SKILLS } from "./treasures";
import { rogue_upgrade_rules } from "./upgrades";
import { CURSE_CARDS, CURSE_TRANSLATE, rogue_curse_rules } from "./curses";

export const type = "mode";

export default function () {
	return {
		name: "general-soul-samsara",
		card: CURSE_CARDS,
		translate: CURSE_TRANSLATE,
		skill: {
			rogue_tiejia,
			rogue_kuangbao,
			rogue_upgrade_rules,
			rogue_curse_rules,
			...TREASURE_SKILLS,
		},
		game: {
			/** 单场战斗结束由模式接管，屏蔽引擎默认结算与再战按钮。 */
			controlOver() {
				return true;
			},
		},
		async start(event: any) {
			_status.mode = "rogue";
			injectStyles();
			ui.arena.style.display = "none";

			const existing = loadRun();
			const meta = mountMetaUI();
			const choice = await meta.start(existing !== undefined);
			const state = choice === "continue" && existing ? existing : createRunState(localStorage.getItem(SEED_KEY) || randomSeed());

			let runtime: BattleRuntime | undefined;
			const debug: DebugHandle = {
				state,
				meta,
				getRuntime: () => runtime,
				setRuntime: value => {
					runtime = value;
				},
				forceResult: result => {
					if (!runtime) return;
					runtime.over = true;
					runtime.result = result;
				},
			};
			installDebugPanel(debug);

			await runFlow(event, meta, state, debug);
			meta.dispose();
		},
	};
}
