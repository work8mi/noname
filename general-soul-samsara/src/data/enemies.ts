import { expandDeck } from "./decks";
import type { EnemyDef } from "../shared/types";

/**
 * M0.1 的 5 种小兵。
 *
 * 意图权重是第一个平衡旋钮；词缀中「铁甲」「狂暴」由引擎技能实现，
 * 「护盾」「吸牌」「妖术」由意图执行器处理。
 */
export const MOB_DEFS: readonly EnemyDef[] = [
	{
		id: "rogue_huangjin",
		name: "黄巾兵",
		hp: 3,
		affixes: ["kuangbao"],
		intents: [
			{ type: "attack", weight: 60 },
			{ type: "defend", weight: 40 },
		],
		deck: expandDeck([
			{ name: "sha", count: 4 },
			{ name: "shan", count: 2 },
			{ name: "jiu", count: 1 },
		]),
	},
	{
		id: "rogue_dunbing",
		name: "盾兵",
		hp: 4,
		affixes: ["tiejia"],
		intents: [
			{ type: "defend", weight: 50 },
			{ type: "attack", weight: 50 },
		],
		deck: expandDeck([
			{ name: "sha", count: 3 },
			{ name: "shan", count: 3 },
			{ name: "tao", count: 1 },
		]),
	},
	{
		id: "rogue_gongbing",
		name: "弓兵",
		hp: 3,
		affixes: ["hudun"],
		intents: [
			{ type: "attack", weight: 70 },
			{ type: "defend", weight: 30 },
		],
		deck: expandDeck([
			{ name: "sha", count: 4 },
			{ name: "shan", count: 2 },
			{ name: "wuzhong", count: 1 },
		]),
	},
	{
		id: "rogue_cike",
		name: "刺客",
		hp: 3,
		affixes: ["xipai"],
		intents: [
			{ type: "attack", weight: 50 },
			{ type: "discard", weight: 50 },
		],
		deck: expandDeck([
			{ name: "sha", count: 3 },
			{ name: "shan", count: 2 },
			{ name: "guohe", count: 1 },
		]),
	},
	{
		id: "rogue_yaodao",
		name: "妖道",
		hp: 3,
		affixes: ["yaoshu"],
		intents: [
			{ type: "attack", weight: 40 },
			{ type: "charge", weight: 30 },
			{ type: "defend", weight: 30 },
		],
		deck: expandDeck([
			{ name: "sha", count: 2 },
			{ name: "shan", count: 3 },
			{ name: "wuzhong", count: 1 },
			{ name: "tao", count: 1 },
		]),
	},
];

export function getMobDef(id: string): EnemyDef | undefined {
	return MOB_DEFS.find(mob => mob.id === id);
}

/** 按层数返回本场战斗的敌人配置（M0.1 先用固定组合演示）。 */
export function pickEncounter(mobs: readonly EnemyDef[], count: number): EnemyDef[] {
	return mobs.slice(0, Math.max(1, Math.min(count, mobs.length)));
}
