import { game } from "noname";
import type { Rng } from "../../shared/rng";
import type { IntentContext } from "../../shared/types";
import { chooseIntent } from "../intents";
import { resolvePhaseIndex } from "../phases";
import type { BattleRuntime } from "./setup";
import { runIntent } from "./runner";
import { clearIntentBadges, updateIntentBadge } from "./ui";

/** 保险丝：防止意图执行异常导致死循环。 */
const MAX_ACTIONS = 400;

/**
 * 阶段推进：体力比例跌破阈值时切换意图表并获得强化。
 *
 * 返回是否发生转换；转换后的下一个行动是缓冲回合，只执行防御。
 */
function applyPhaseTransition(enemy: any): boolean {
	const phases = enemy.storage?.roguePhases ?? [];
	if (!phases.length) return false;
	const target = resolvePhaseIndex(enemy.hp, enemy.maxHp, phases);
	const current = enemy.storage.roguePhaseIndex ?? 0;
	if (target <= current) return false;
	enemy.storage.roguePhaseIndex = target;
	for (let i = current; i < target; i++) {
		const phase = phases[i];
		if (phase.damageBonus) enemy.storage.rogueDamageBonus = Math.max(enemy.storage.rogueDamageBonus ?? 0, phase.damageBonus);
		enemy.storage.rogueIntents = phase.intents;
		enemy.popup(phase.label);
	}
	enemy.storage.rogueTransition = true;
	return true;
}

/**
 * 自建战斗循环：玩家走标准回合（`player.phase()`），敌人由意图驱动。
 *
 * 敌人不进入标准出牌阶段，因此不会触发引擎 AI 的自由出牌。
 */
export async function battleLoop(event: any, runtime: BattleRuntime, rng: Rng): Promise<"victory" | "defeat"> {
	let index = 0;
	let turn = 0;
	while (!runtime.over && turn < MAX_ACTIONS) {
		const order = [game.me, ...runtime.enemies];
		const actor = order[index % order.length];
		if (actor?.isAlive?.() && game.players.includes(actor)) {
			if (actor === game.me) {
				await actor.phase();
			} else {
				// 玩家回合内可能把敌人打到阈值以下，先统一检查阶段推进
				for (const enemy of runtime.enemies) {
					if (enemy.isAlive()) applyPhaseTransition(enemy);
				}
				const context: IntentContext = {
					hp: actor.hp,
					maxHp: actor.maxHp,
					charge: actor.storage.rogueCharge ?? 0,
					turn,
				};
				const intent = actor.storage.rogueTransition ? { type: "defend" as const } : chooseIntent(actor.storage.rogueIntents ?? [], context, rng);
				actor.storage.rogueTransition = false;
				actor.storage.rogueIntent = intent;
				updateIntentBadge(actor, intent, context.charge);
				await runIntent(actor, intent, runtime, rng);
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
