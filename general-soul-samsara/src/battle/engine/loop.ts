import { game } from "noname";
import type { Rng } from "../../shared/rng";
import type { IntentContext } from "../../shared/types";
import { chooseIntent } from "../intents";
import type { BattleRuntime } from "./setup";
import { runIntent } from "./runner";
import { clearIntentBadges, updateIntentBadge } from "./ui";

/** 保险丝：防止意图执行异常导致死循环。 */
const MAX_ACTIONS = 400;

/**
 * 自建战斗循环：玩家走标准回合（`player.phase()`），敌人由意图驱动。
 *
 * 敌人不进入标准出牌阶段，因此不会触发引擎 AI 的自由出牌。
 */
export async function battleLoop(event: any, runtime: BattleRuntime, rng: Rng): Promise<"victory" | "defeat"> {
	const order = [game.me, ...runtime.enemies];
	let index = 0;
	let turn = 0;
	while (!runtime.over && turn < MAX_ACTIONS) {
		const actor = order[index % order.length];
		if (actor?.isAlive?.() && game.players.includes(actor)) {
			if (actor === game.me) {
				await actor.phase();
			} else {
				const context: IntentContext = {
					hp: actor.hp,
					maxHp: actor.maxHp,
					charge: actor.storage.rogueCharge ?? 0,
					turn,
				};
				const intent = chooseIntent(actor.storage.rogueIntents ?? [], context, rng);
				actor.storage.rogueIntent = intent;
				updateIntentBadge(actor, intent, context.charge);
				await runIntent(actor, intent);
			}
			await event.trigger("phaseOver");
		}
		if (!game.me.isAlive()) {
			runtime.over = true;
			runtime.result = "defeat";
		} else if (runtime.enemies.every(enemy => !enemy.isAlive())) {
			runtime.over = true;
			runtime.result = "victory";
		}
		index++;
		turn++;
	}
	if (!runtime.over) {
		runtime.over = true;
		runtime.result = "defeat";
	}
	clearIntentBadges(runtime.enemies);
	return runtime.result ?? "defeat";
}
