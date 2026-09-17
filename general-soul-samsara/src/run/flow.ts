import { game, ui } from "noname";
import { createRng } from "../shared/rng";
import type { EnemyDef } from "../shared/types";
import { MOB_DEFS } from "../data/enemies";
import { rollEncounter } from "../mode/encounters";
import type { BattleRuntime } from "../battle/engine/setup";
import { setupBattle } from "../battle/engine/setup";
import { battleLoop } from "../battle/engine/loop";
import type { MetaUI } from "../meta/app";
import type { MapNode } from "./map";
import { generateChapter } from "./map";
import { addGold, type RunState } from "./state";
import { applyEventEffects, rollEvent } from "./events";
import { pickGrantedSkill, rollEliteGold, rollGold, rollSkillOffers } from "./rewards";
import { rollTreasure } from "../data/treasures";
import { clearRun, saveRun } from "./save";

export interface DebugHandle {
	state: RunState;
	getRuntime: () => BattleRuntime | undefined;
	setRuntime: (runtime: BattleRuntime | undefined) => void;
	/** 调试用：直接把当前战斗判定为胜利/失败（在下一次行动结束后生效）。 */
	forceResult: (result: "victory" | "defeat") => void;
}

/**
 * 单局主循环：地图选点 → 节点结算（战斗/商店/休整/事件）→ 下一层。
 *
 * 所有随机都从节点派生的确定性种子产生，便于复盘与存档恢复。
 */
export async function runFlow(event: any, meta: MetaUI, state: RunState, debug: DebugHandle): Promise<void> {
	saveRun(state);
	const map = generateChapter(state.seed, state.chapter);
	while (true) {
		const node = await meta.chooseNode(map, state);
		const nodeRng = createRng(`${state.seed}-${node.id}-${state.battleCount}`);
		const outcome = await resolveNode(event, meta, state, node, nodeRng, debug);
		saveRun(state);
		if (outcome === "defeat") break;
		if (node.layer >= map.layers.length - 1) break;
		state.layer = node.layer + 1;
	}
	clearRun();
	await meta.showRunResult(state.hp > 0 ? "victory" : "defeat", state);
}

async function resolveNode(
	event: any,
	meta: MetaUI,
	state: RunState,
	node: MapNode,
	rng: ReturnType<typeof createRng>,
	debug: DebugHandle
): Promise<"victory" | "defeat" | "skip"> {
	switch (node.type) {
		case "shop":
			await meta.openShop(state, rng);
			return "skip";
		case "rest":
			await meta.openRest(state);
			return "skip";
		case "event": {
			const def = rollEvent(state.chapter, state.usedEvents, rng);
			if (!def) {
				addGold(state, 30);
				return "skip";
			}
			const option = await meta.chooseEventOption(def, state);
			state.usedEvents.push(def.id);
			const pending = applyEventEffects(state, option.effects);
			for (let i = 0; i < pending.removals; i++) {
				const removed = await meta.promptRemoveCard(state, "选择要删除的牌");
				if (!removed) break;
			}
			const granted = pickGrantedSkill(state, rng, pending.skillId, pending.skillKind);
			if (granted) await meta.offerReward([granted], 0, state);
			else if (pending.skillId || pending.skillKind) addGold(state, 40);
			state.nextBattleEnemyHp += pending.enemyHpBonus;
			return "skip";
		}
		default: {
			const result = await runBattle(event, meta, state, node, rng, debug);
			state.battleCount++;
			if (result === "defeat") return "defeat";
			const gold = node.type === "elite" ? rollEliteGold(rng) : rollGold(rng);
			addGold(state, gold);
			if (node.type === "elite") {
				const treasure = rollTreasure(rng, state.treasures, ["common", "rare", "legendary"]);
				if (treasure) await meta.offerTreasure(treasure, state);
			}
			await meta.offerReward(rollSkillOffers(state, rng), gold, state);
			return "victory";
		}
	}
}

export async function runBattle(
	event: any,
	meta: MetaUI,
	state: RunState,
	node: MapNode,
	rng: ReturnType<typeof createRng>,
	debug: DebugHandle
): Promise<"victory" | "defeat"> {
	const baseEnemies = node.type === "elite" ? eliteEncounter() : rollEncounter(rng);
	const bonusHp = state.nextBattleEnemyHp;
	if (bonusHp > 0) state.nextBattleEnemyHp = 0;
	const enemies = bonusHp > 0 ? baseEnemies.map(enemy => ({ ...enemy, hp: enemy.hp + bonusHp })) : baseEnemies;
	const plan = {
		playerCharacter: state.character,
		playerDeck: state.deck.map(card => card.id),
		enemies,
		seed: `${state.seed}-${node.id}`,
		treasures: [...state.treasures],
	};
	meta.setVisible(false);
	ui.arena.style.display = "";
	const runtime = await setupBattle(plan, rng, state.hp);
	debug.setRuntime(runtime);
	const result = await battleLoop(event, runtime, rng);
	debug.setRuntime(undefined);
	if (result === "victory" && game.me?.isAlive?.()) state.hp = Math.max(1, Math.min(state.maxHp, game.me.hp));
	else state.hp = 0;
	ui.arena.style.display = "none";
	meta.setVisible(true);
	return result;
}

/** 精英战：M0.3 接入华雄前先用两位小兵的组合。 */
function eliteEncounter(): EnemyDef[] {
	return [MOB_DEFS[1], MOB_DEFS[4]];
}
