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

export const type = "mode";

export default function () {
	return {
		name: "general-soul-samsara",
		skill: {
			rogue_tiejia,
			rogue_kuangbao,
		},
		game: {
			/** 每回合摸 3 张（概要设计 §3.1）。 */
			modPhaseDraw(player: any) {
				return player.draw(3);
			},
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
