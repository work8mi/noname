import { game, ui } from "noname";
import { createRng } from "../shared/rng";
import type { TreasureQuality } from "../data/treasures";
import { rollTreasure } from "../data/treasures";
import { getChapterBoss } from "../data/enemies";
import { rollEncounter } from "../mode/encounters";
import type { BattleRuntime } from "../battle/engine/setup";
import { setupBattle } from "../battle/engine/setup";
import { battleLoop } from "../battle/engine/loop";
import type { MetaUI } from "../meta/app";
import type { MapNode } from "./map";
import { generateChapter } from "./map";
import { addGold, type RunState } from "./state";
import { applyEventEffects, rollEvent } from "./events";
import { pickGrantedSkill, rollBossGold, rollEliteGold, rollGold, rollSkillOffers } from "./rewards";
import { clearRun, saveRun } from "./save";

/** 原型共两章（需求规格 §2.1）。 */
export const MAX_CHAPTER = 2;

export interface DebugHandle {
	state: RunState;
	meta: MetaUI;
	getRuntime: () => BattleRuntime | undefined;
	setRuntime: (runtime: BattleRuntime | undefined) => void;
	/** 调试用：直接把当前战斗判定为胜利/失败（在下一次行动结束后生效）。 */
	forceResult: (result: "victory" | "defeat") => void;
}

/**
 * 单局主循环：地图选点 → 节点结算（战斗/商店/休整/事件）→ 下一层 → 下一章。
 *
 * 所有随机都从节点派生的确定性种子产生，便于复盘与存档恢复。
 */
export async function runFlow(event: any, meta: MetaUI, state: RunState, debug: DebugHandle): Promise<void> {
	saveRun(state);
	let map = generateChapter(state.seed, state.chapter);
	while (true) {
		const node = await meta.chooseNode(map, state);
		const nodeRng = createRng(`${state.seed}-${node.id}-${state.battleCount}`);
		const outcome = await resolveNode(event, meta, state, node, nodeRng, debug);
		saveRun(state);
		if (outcome === "defeat") break;
		if (node.layer >= map.layers.length - 1) {
			if (state.chapter >= MAX_CHAPTER) break;
			await meta.showChapterClear(state.chapter, state);
			state.chapter++;
			state.layer = 0;
			map = generateChapter(state.seed, state.chapter);
			saveRun(state);
			continue;
		}
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
			for (let i = 0; i < pending.treasures; i++) {
				const treasure = rollTreasure(rng, state.treasures, ["common", "rare", "legendary"]);
				if (treasure) await meta.offerTreasure(treasure, state);
			}
			state.nextBattleEnemyHp += pending.enemyHpBonus;
			return "skip";
		}
		default: {
			const result = await runBattle(event, meta, state, node, rng, debug);
			state.battleCount++;
			if (result === "defeat") return "defeat";
			const isBoss = node.type === "boss";
			const gold = isBoss ? rollBossGold(rng) : node.type === "elite" ? rollEliteGold(rng) : rollGold(rng);
			addGold(state, gold);
			if (node.type === "elite" || isBoss) {
				const qualities: TreasureQuality[] = isBoss ? ["rare", "legendary", "gamechanger"] : ["common", "rare", "legendary"];
				const treasure = rollTreasure(rng, state.treasures, qualities);
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
	const baseEnemies =
		node.type === "elite" || node.type === "boss" ? [getChapterBoss(state.chapter)] : rollEncounter(rng, state.chapter);
	const bonusHp = state.nextBattleEnemyHp;
	if (bonusHp > 0) state.nextBattleEnemyHp = 0;
	const enemies = bonusHp > 0 ? baseEnemies.map(enemy => ({ ...enemy, hp: enemy.hp + bonusHp })) : baseEnemies;
	const plan = {
		playerCharacter: state.character,
		playerDeck: state.deck.map(card => ({ name: card.id, upgraded: card.upgraded })),
		enemies,
		seed: `${state.seed}-${node.id}`,
		treasures: [...state.treasures],
		skills: [...state.slots.active, ...state.slots.passive].filter(Boolean).map(skill => ({ id: skill!.id, level: skill!.level })),
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
