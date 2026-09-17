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
			{ type: "attack", weight: 30 },
			{ type: "charge", weight: 25 },
			{ type: "defend", weight: 20 },
			{ type: "seal", weight: 25 },
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

/** 第一章章尾精英：华雄（原版【恃勇】+ 狂暴 + 蓄力斩）。 */
export const HUAXIONG_DEF: EnemyDef = {
	id: "huaxiong",
	name: "华雄",
	hp: 8,
	affixes: ["kuangbao"],
	intents: [
		{ type: "attack", weight: 50 },
		{ type: "charge", weight: 30, value: 2 },
		{ type: "defend", weight: 20 },
	],
	deck: expandDeck([
		{ name: "sha", count: 5 },
		{ name: "shan", count: 3 },
		{ name: "jiu", count: 1 },
		{ name: "tao", count: 1 },
	]),
};

/** 第二章终局首领：张角（原版【雷击】【鬼道】+ 三阶段）。 */
export const ZHANGJIAO_DEF: EnemyDef = {
	id: "zhangjiao",
	name: "张角",
	hp: 12,
	affixes: [],
	intents: [
		{ type: "attack", weight: 60 },
		{ type: "defend", weight: 40 },
	],
	deck: expandDeck([
		{ name: "sha", count: 3 },
		{ name: "shan", count: 4 },
		{ name: "wuzhong", count: 1 },
		{ name: "juedou", count: 1 },
		{ name: "tao", count: 1 },
	]),
	phases: [
		{
			label: "黄天当立",
			threshold: 0.66,
			intents: [
				{ type: "attack", weight: 40 },
				{ type: "summon", weight: 40, summon: MOB_DEFS[0] },
				{ type: "defend", weight: 20 },
			],
		},
		{
			label: "苍天已死",
			threshold: 0.33,
			intents: [
				{ type: "attack", weight: 50 },
				{ type: "judge", weight: 30 },
				{ type: "defend", weight: 20 },
			],
			damageBonus: 1,
		},
	],
};

/** 按章节返回章尾对手（第 1 章精英华雄，第 2 章首领张角）。 */
export function getChapterBoss(chapter: number): EnemyDef {
	return chapter >= 2 ? ZHANGJIAO_DEF : HUAXIONG_DEF;
}

/** 按层数返回本场战斗的敌人配置（M0.1 先用固定组合演示）。 */
export function pickEncounter(mobs: readonly EnemyDef[], count: number): EnemyDef[] {
	return mobs.slice(0, Math.max(1, Math.min(count, mobs.length)));
}
